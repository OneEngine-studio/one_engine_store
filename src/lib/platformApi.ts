// Client for the OneEngine Platform API (services/platform-api).
// Ownership, prices and launch tickets are decided by the server; this file only asks.
//
// Inside the desktop app every call goes through the main process, which holds the tokens, decides the
// service address and only forwards a fixed set of routes (see electron/platform.cjs). The in-memory
// fallback below exists only so the UI can be opened in a plain browser during development; it keeps
// tokens in memory and never writes them to storage.

const EMAIL_KEY = 'oneengine_last_email';
const DEVICE_KEY = 'oneengine_device_id';

/** Facts the desktop app's main process reports about this installation. */
export interface AppInfo {
  version: string;
  /** False when the build carries no usable service address. */
  serviceConfigured: boolean;
  serviceUrl: string;
  /** Game download, install and launch are part of a later release and ship switched off. */
  gamesEnabled: boolean;
}

// Only a development server may fall back to a local address. A production page with no address says so.
const BROWSER_DEV_URL: string =
  (import.meta.env.VITE_PLATFORM_API_URL as string | undefined) || (import.meta.env.DEV ? 'http://127.0.0.1:8080' : '');

export interface PlatformPrice {
  currency: string;
  amountMinor: number;
  discountPercent: number;
  finalMinor: number;
}

export interface PlatformProduct {
  productId: string;
  kind: string;
  title: string;
  summary: string | null;
  developer: string | null;
  tags: string[];
  price: PlatformPrice | null;
}

export interface PlatformUser {
  userId: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}

export interface PlatformBuild {
  buildId: string;
  version: string;
  executable: string;
  platform: string;
  sizeBytes: number;
  sha256: string;
  downloadUrl: string;
  expiresAt: number;
}

export interface LaunchTicket {
  ticket: string;
  expiresAt: number;
}

export class PlatformError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
  }
}

const readStorage = (key: string): string => {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable: everything still works for this run
  }
};

type Reply = { status: number; data: Record<string, unknown> };
interface CallOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  timeoutMs?: number;
}

class PlatformApi {
  private info: AppInfo | null = null;
  private infoPromise: Promise<AppInfo> | null = null;

  // Browser-only fallback state (never used inside the desktop app)
  private mem: { access: string; accessExp: number; refresh: string } | null = null;

  /** Loads (once) what the installation says about itself: version, service address, feature switches. */
  init(): Promise<AppInfo> {
    this.infoPromise ??= (async () => {
      const bridge = typeof window !== 'undefined' ? window.electronAPI?.app : undefined;
      let info: AppInfo | null = null;
      try {
        info = bridge ? await bridge.info() : null;
      } catch {
        info = null;
      }
      this.info = info ?? {
        version: __APP_VERSION__,
        serviceConfigured: !!BROWSER_DEV_URL,
        serviceUrl: BROWSER_DEV_URL,
        gamesEnabled: !bridge && import.meta.env.VITE_ENABLE_GAMES === 'true',
      };
      return this.info;
    })();
    return this.infoPromise;
  }

  /** The service address in use, or '' before init() has finished or when the build has none. */
  getUrl(): string {
    return this.info?.serviceUrl ?? '';
  }

  /** Opens an https link in the system browser (desktop app) or a new tab (plain browser). */
  async openExternal(url: string): Promise<void> {
    const bridge = typeof window !== 'undefined' ? window.electronAPI?.app : undefined;
    if (bridge) await bridge.openExternal(url);
    else window.open(url, '_blank', 'noopener,noreferrer');
  }

  /** The email used last time, to prefill the sign-in form. */
  lastEmail(): string {
    return readStorage(EMAIL_KEY);
  }

  getDeviceId(): string {
    let id = readStorage(DEVICE_KEY);
    if (id.length < 8) {
      id = `dev_${crypto.randomUUID()}`;
      writeStorage(DEVICE_KEY, id);
    }
    return id;
  }

  // ---------------------------------------------------------------- transport
  private async browserFetch(path: string, method: string, body: unknown, token: string, timeoutMs: number): Promise<Reply> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(`${this.getUrl()}${path}`, {
        method,
        headers: {
          ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ctrl.signal,
      });
      let data: Record<string, unknown> = {};
      try {
        data = (await res.json()) as Record<string, unknown>;
      } catch {
        data = {};
      }
      return { status: res.status, data };
    } catch (err) {
      const timedOut = err instanceof DOMException && err.name === 'AbortError';
      return {
        status: 0,
        data: {
          error: {
            code: timedOut ? 'timeout' : 'unreachable',
            message: timedOut
              ? 'The OneEngine service did not answer in time.'
              : "Can't reach the OneEngine service. Check your internet connection and try again.",
          },
        },
      };
    } finally {
      clearTimeout(timer);
    }
  }

  private adopt(data: Record<string, unknown>): Record<string, unknown> {
    const { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt: _r, ...safe } = data;
    this.mem = { access: String(accessToken), accessExp: Number(accessExpiresAt), refresh: String(refreshToken) };
    return safe;
  }

  private async browserRefresh(): Promise<boolean> {
    if (!this.mem?.refresh) return false;
    const res = await this.browserFetch('/v1/auth/refresh', 'POST', { refreshToken: this.mem.refresh }, '', 10000);
    if (res.status === 200 && res.data.accessToken) {
      this.adopt(res.data);
      return true;
    }
    if (res.status === 401) this.mem = null;
    return false;
  }

  private async send(path: string, { method = 'GET', body, auth = false, timeoutMs = 10000 }: CallOptions): Promise<Reply> {
    await this.init();
    const bridge = typeof window !== 'undefined' ? window.electronAPI?.platform : undefined;
    if (bridge) return bridge.request({ path, method, body });
    if (!this.getUrl()) {
      return { status: 0, data: { error: { code: 'not_configured', message: 'This build of OneEngine Store has no service address.' } } };
    }

    if (!auth) {
      const res = await this.browserFetch(path, method, body, '', timeoutMs);
      if (res.status === 200 && path.startsWith('/v1/auth/') && res.data.accessToken) res.data = this.adopt(res.data);
      return res;
    }
    if (!this.mem) return { status: 401, data: { error: { code: 'auth_required', message: 'Sign in to continue.' } } };
    if (this.mem.accessExp - Date.now() < 30_000) await this.browserRefresh();
    if (!this.mem) return { status: 401, data: { error: { code: 'auth_required', message: 'Sign in to continue.' } } };
    let res = await this.browserFetch(path, method, body, this.mem.access, timeoutMs);
    if (res.status === 401 && (await this.browserRefresh()) && this.mem) {
      res = await this.browserFetch(path, method, body, this.mem.access, timeoutMs);
    }
    if (res.status === 200 && path.startsWith('/v1/auth/') && res.data.accessToken) res.data = this.adopt(res.data);
    return res;
  }

  private async call<T>(path: string, options: CallOptions = {}): Promise<T> {
    const res = await this.send(path, options);
    if (res.status >= 200 && res.status < 300) return res.data as T;
    const error = res.data?.error as { code?: string; message?: string } | undefined;
    throw new PlatformError(
      error?.message || (res.status ? `The service answered ${res.status}.` : 'The service could not be reached.'),
      error?.code || 'http_error',
      res.status
    );
  }

  // ---------------------------------------------------------------- accounts
  async register(email: string, password: string, displayName: string): Promise<PlatformUser> {
    const out = await this.call<{ user: PlatformUser }>('/v1/auth/register', {
      method: 'POST',
      body: { email, password, displayName },
    });
    writeStorage(EMAIL_KEY, email);
    return out.user;
  }

  async login(email: string, password: string): Promise<PlatformUser> {
    const out = await this.call<{ user: PlatformUser }>('/v1/auth/login', { method: 'POST', body: { email, password } });
    writeStorage(EMAIL_KEY, email);
    return out.user;
  }

  /** Signs in again from the session saved by a previous run. Returns false when there is none. */
  async restore(): Promise<boolean> {
    const bridge = typeof window !== 'undefined' ? window.electronAPI?.platform : undefined;
    if (!bridge) return false;
    return (await bridge.restore()).ok;
  }

  async logout(): Promise<void> {
    const bridge = typeof window !== 'undefined' ? window.electronAPI?.platform : undefined;
    if (bridge) {
      await bridge.signOut();
      return;
    }
    const refreshToken = this.mem?.refresh;
    this.mem = null;
    if (refreshToken) await this.browserFetch('/v1/auth/logout', 'POST', { refreshToken }, '', 4000);
  }

  async verifyEmail(code: string): Promise<void> {
    await this.call('/v1/auth/verify-email', { method: 'POST', body: { code }, auth: true });
  }

  async resendVerification(): Promise<void> {
    await this.call('/v1/auth/resend-verification', { method: 'POST', body: {}, auth: true });
  }

  async forgotPassword(email: string): Promise<void> {
    await this.call('/v1/auth/forgot-password', { method: 'POST', body: { email } });
  }

  /** True when this is the desktop app and the service has Google sign-in set up. */
  async googleAvailable(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.electronAPI?.platform.googleSignIn) return false;
    try {
      const out = await this.call<{ google?: { clientId?: string } | null }>('/v1/auth/providers', { timeoutMs: 6000 });
      return !!out.google?.clientId;
    } catch {
      return false;
    }
  }

  /** Opens Google in the system browser; resolves once the player is signed in to a OneEngine account. */
  async googleSignIn(): Promise<PlatformUser> {
    const bridge = typeof window !== 'undefined' ? window.electronAPI?.platform : undefined;
    if (!bridge) throw new PlatformError('Google sign-in needs the OneEngine Store desktop app.', 'google_unavailable', 0);
    const res = await bridge.googleSignIn();
    if (res.status >= 200 && res.status < 300) return (res.data as { user: PlatformUser }).user;
    const error = res.data?.error as { code?: string; message?: string } | undefined;
    throw new PlatformError(error?.message || 'Google sign-in did not finish.', error?.code || 'google_error', res.status);
  }

  async googleCancel(): Promise<void> {
    await window.electronAPI?.platform.googleCancel?.();
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    await this.call('/v1/auth/reset-password', { method: 'POST', body: { email, code, newPassword } });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.call('/v1/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
      auth: true,
    });
  }

  // ---------------------------------------------------------------- data
  async health(): Promise<{ ok: boolean; message: string }> {
    try {
      await this.call('/healthz', { timeoutMs: 4000 });
      return { ok: true, message: 'OneEngine service is online.' };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  async catalog(): Promise<PlatformProduct[]> {
    return (await this.call<{ items?: PlatformProduct[] }>('/v1/catalog')).items ?? [];
  }

  async me(): Promise<PlatformUser> {
    return this.call<PlatformUser>('/v1/me', { auth: true });
  }

  async updateProfile(displayName: string): Promise<PlatformUser> {
    return this.call<PlatformUser>('/v1/me', { method: 'PATCH', body: { displayName }, auth: true });
  }

  async library(): Promise<PlatformProduct[]> {
    return (await this.call<{ items?: PlatformProduct[] }>('/v1/library', { auth: true })).items ?? [];
  }

  async claim(productId: string): Promise<void> {
    await this.call(`/v1/library/${encodeURIComponent(productId)}/claim`, { method: 'POST', body: {}, auth: true });
  }

  async latestBuild(productId: string): Promise<PlatformBuild> {
    return this.call<PlatformBuild>(`/v1/products/${encodeURIComponent(productId)}/builds/latest?platform=win64`, {
      auth: true,
    });
  }

  async launchTicket(productId: string): Promise<LaunchTicket> {
    return this.call<LaunchTicket>('/v1/launch-tickets', {
      method: 'POST',
      body: { productId, deviceId: this.getDeviceId() },
      auth: true,
    });
  }
}

export const platformApi = new PlatformApi();
