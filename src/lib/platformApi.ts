// Client for the OneEngine Platform API (services/platform-api).
// Ownership, prices and launch tickets are decided by the server; this file only asks.

const URL_KEY = 'oneengine_platform_url';
const IDENTITY_KEY = 'oneengine_dev_identity'; // present only while signed in (restored on startup)
const LAST_KEY = 'oneengine_last_identity'; // survives sign-out, only prefills the form
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

export interface PlatformProfile {
  userId: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
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

interface Identity {
  email: string;
  displayName: string;
}

const readStorage = (key: string): string => {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
};

const writeStorage = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
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

const parseJson = (text: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
};

class PlatformApi {
  private baseUrl = normalizePlatformUrl(readStorage(URL_KEY)) || DEFAULT_PLATFORM_URL;
  private token = '';
  private expiresAt = 0;
  private identity: Identity | null = null;

  getUrl() {
    return this.baseUrl;
  }

  setUrl(input: string): boolean {
    const url = normalizePlatformUrl(input);
    if (!url) return false;
    if (url !== this.baseUrl) {
      this.baseUrl = url;
      writeStorage(URL_KEY, url);
      this.token = '';
      this.expiresAt = 0;
    }
    return true;
  }

  isSignedIn() {
    return this.identity !== null;
  }

  private readIdentity(key: string): Identity | null {
    const parsed = parseJson(readStorage(key));
    if (typeof parsed?.email === 'string' && typeof parsed.displayName === 'string') {
      return { email: parsed.email, displayName: parsed.displayName };
    }
    return null;
  }

  /** Set when the player was still signed in at last shutdown. */
  rememberedIdentity(): Identity | null {
    return this.readIdentity(IDENTITY_KEY);
  }

  /** The identity used last time, to prefill the sign-in form. */
  lastIdentity(): Identity | null {
    return this.readIdentity(LAST_KEY);
  }

  getDeviceId(): string {
    let id = readStorage(DEVICE_KEY);
    if (id.length < 8) {
      id = `dev_${crypto.randomUUID()}`;
      writeStorage(DEVICE_KEY, id);
    }
    return id;
  }

  private async send(path: string, method: string, body?: unknown, token?: string, timeoutMs = 6000) {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (token) headers.authorization = `Bearer ${token}`;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ctrl.signal,
      });
    } catch (err) {
      const timedOut = err instanceof DOMException && err.name === 'AbortError';
      throw new PlatformError(
        timedOut
          ? `The OneEngine service at ${this.baseUrl} did not answer in time.`
          : `Can't reach the OneEngine service at ${this.baseUrl}. Check the address and that it is running.`,
        timedOut ? 'timeout' : 'unreachable',
        0
      );
    } finally {
      clearTimeout(timer);
    }

    const data = parseJson(await res.text());
    if (!res.ok) {
      const error = data?.error as { code?: string; message?: string } | undefined;
      throw new PlatformError(error?.message || `The service answered ${res.status}.`, error?.code || 'http_error', res.status);
    }
    return data ?? {};
  }

  /** Development sign-in. Replaced by the OneEngine ID flow once an identity provider exists. */
  async signIn(email: string, displayName: string): Promise<PlatformProfile> {
    const out = (await this.send('/v1/dev/login', 'POST', { email, displayName })) as {
      accessToken?: string;
      expiresInSeconds?: number;
    };
    if (!out.accessToken) throw new PlatformError('The service did not return a session.', 'bad_response', 200);
    this.token = out.accessToken;
    this.expiresAt = Date.now() + (out.expiresInSeconds ?? 600) * 1000;
    this.identity = { email, displayName };
    writeStorage(IDENTITY_KEY, JSON.stringify(this.identity));
    writeStorage(LAST_KEY, JSON.stringify(this.identity));
    return this.me();
  }

  signOut() {
    this.token = '';
    this.expiresAt = 0;
    this.identity = null;
    writeStorage(IDENTITY_KEY, null);
  }

  /** Signed-in call. Dev tokens are short lived, so refresh quietly before and after a 401. */
  private async authed(path: string, method = 'GET', body?: unknown) {
    if (!this.identity) throw new PlatformError('Sign in to continue.', 'auth_required', 401);
    const refresh = async () => {
      const { email, displayName } = this.identity!;
      const out = (await this.send('/v1/dev/login', 'POST', { email, displayName })) as {
        accessToken: string;
        expiresInSeconds?: number;
      };
      this.token = out.accessToken;
      this.expiresAt = Date.now() + (out.expiresInSeconds ?? 600) * 1000;
    };
    if (!this.token || this.expiresAt - Date.now() < 30_000) await refresh();
    try {
      return await this.send(path, method, body, this.token);
    } catch (err) {
      if (err instanceof PlatformError && err.status === 401) {
        await refresh();
        return this.send(path, method, body, this.token);
      }
      throw err;
    }
  }

  async health(): Promise<{ ok: boolean; message: string }> {
    try {
      await this.send('/healthz', 'GET', undefined, undefined, 4000);
      return { ok: true, message: 'OneEngine service is online.' };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  async catalog(): Promise<PlatformProduct[]> {
    const out = (await this.send('/v1/catalog', 'GET')) as { items?: PlatformProduct[] };
    return out.items ?? [];
  }

  async me(): Promise<PlatformProfile> {
    return (await this.authed('/v1/me')) as unknown as PlatformProfile;
  }

  async library(): Promise<PlatformProduct[]> {
    const out = (await this.authed('/v1/library')) as { items?: PlatformProduct[] };
    return out.items ?? [];
  }

  async claim(productId: string): Promise<void> {
    await this.authed(`/v1/library/${encodeURIComponent(productId)}/claim`, 'POST');
  }

  async launchTicket(productId: string): Promise<LaunchTicket> {
    return (await this.authed('/v1/launch-tickets', 'POST', {
      productId,
      deviceId: this.getDeviceId(),
    })) as unknown as LaunchTicket;
  }
}

export const platformApi = new PlatformApi();
