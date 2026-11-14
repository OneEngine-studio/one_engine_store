// Client for the OneEngine Platform API (services/platform-api).
// Ownership, prices and launch tickets are decided by the server; this file only asks.
//
// Inside the desktop app every call goes through the main process, which holds the tokens (see
// electron/platform.cjs). The in-memory fallback below exists only so the UI can be opened in a plain
// browser during development; it keeps tokens in memory and never writes them to storage.

const URL_KEY = 'oneengine_platform_url';
const EMAIL_KEY = 'oneengine_last_email';
const DEVICE_KEY = 'oneengine_device_id';

export const DEFAULT_PLATFORM_URL: string =
  (import.meta.env.VITE_PLATFORM_API_URL as string | undefined) || 'http://127.0.0.1:8080';

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

/** Accepts "host:8080" or a full URL; returns an origin with an optional path, or null. */
export function normalizePlatformUrl(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `http://${text}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  } catch {
    return null;
  }
}

type Reply = { status: number; data: Record<string, unknown> };
interface CallOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  timeoutMs?: number;
}

class PlatformApi {
  private baseUrl = normalizePlatformUrl(readStorage(URL_KEY)) || DEFAULT_PLATFORM_URL;

  // Browser-only fallback state (never used inside the desktop app)
  private mem: { access: string; accessExp: number; refresh: string } | null = null;

  getUrl() {
    return this.baseUrl;
  }

  setUrl(input: string): boolean {
    const url = normalizePlatformUrl(input);
    if (!url) return false;
    if (url !== this.baseUrl) {
      this.baseUrl = url;
      writeStorage(URL_KEY, url);
      this.mem = null;
    }
    return true;
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
      const res = await fetch(`${this.baseUrl}${path}`, {
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
              ? `The OneEngine service at ${this.baseUrl} did not answer in time.`
              : `Can't reach the OneEngine service at ${this.baseUrl}. Check the address and your connection.`,
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
    const bridge = typeof window !== 'undefined' ? window.electronAPI?.platform : undefined;
    if (bridge) return bridge.request({ baseUrl: this.baseUrl, path, method, body, auth });

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
    return (await bridge.restore({ baseUrl: this.baseUrl })).ok;
  }

  async logout(): Promise<void> {
    const bridge = typeof window !== 'undefined' ? window.electronAPI?.platform : undefined;
    if (bridge) {
      await bridge.signOut({ baseUrl: this.baseUrl });
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
