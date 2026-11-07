import { Session } from '@heroiclabs/nakama-js';
import { UserProfile } from '../types/store';

export interface NakamaConfig {
  host: string;
  port: string;
  useSsl: boolean;
  serverKey: string;
  /** Optional path prefix in front of /v2, e.g. "/nakamagateway". */
  basePath: string;
}

type ApiResponse = { ok: boolean; status: number; statusText: string; data: string };

const STORAGE_KEY_TOKEN = 'nakama_session_token';
const STORAGE_KEY_REFRESH = 'nakama_refresh_token';
const STORAGE_KEY_CONFIG = 'nakama_server_config';

export const DEFAULT_NAKAMA_CONFIG: NakamaConfig = {
  host: import.meta.env.VITE_NAKAMA_HOST || '161.118.227.105',
  port: import.meta.env.VITE_NAKAMA_PORT || '7350',
  useSsl: import.meta.env.VITE_NAKAMA_SSL === 'true',
  serverKey: import.meta.env.VITE_NAKAMA_SERVER_KEY || 'defaultkey',
  basePath: import.meta.env.VITE_NAKAMA_BASE_PATH || '',
};

const normalizeBasePath = (p: string) => {
  const trimmed = p.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

/**
 * Turns a pasted address ("https://host/prefix", "host:7350", ...) into config fields.
 * Returns null when the text can't be read as a server address.
 */
export function parseServerAddress(
  input: string
): Pick<NakamaConfig, 'host' | 'port' | 'useSsl' | 'basePath'> | null {
  const text = input.trim();
  if (!text) return null;
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text);
  // A bare "host:7350" is plain Nakama; anything else bare is assumed to be behind TLS.
  const candidate = hasScheme ? text : `${/:7350(\/|$)/.test(text) ? 'http' : 'https'}://${text}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname) return null;
    const useSsl = url.protocol === 'https:';
    return {
      host: url.hostname,
      port: url.port || (useSsl ? '443' : '80'),
      useSsl,
      basePath: normalizeBasePath(url.pathname),
    };
  } catch {
    return null;
  }
}

/** Human-readable address for messages and the address field. */
export function formatServerAddress(
  c: Pick<NakamaConfig, 'host' | 'port' | 'useSsl' | 'basePath'>
): string {
  const defaultPort = c.useSsl ? '443' : '80';
  const port = !c.port || c.port === defaultPort ? '' : `:${c.port}`;
  return `${c.useSsl ? 'https' : 'http'}://${c.host}${port}${normalizeBasePath(c.basePath || '')}`;
}

const parseJson = (text: string): Record<string, unknown> | null => {
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

class NakamaService {
  private session: Session | null = null;
  private config: NakamaConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  public getConfig(): NakamaConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<NakamaConfig>) {
    this.config = { ...this.config, ...newConfig, basePath: normalizeBasePath(newConfig.basePath ?? this.config.basePath) };
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch {
      // ignore
    }
  }

  private loadConfig(): NakamaConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const merged = { ...DEFAULT_NAKAMA_CONFIG, ...JSON.parse(saved) };
        return { ...merged, basePath: normalizeBasePath(merged.basePath || '') };
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_NAKAMA_CONFIG, basePath: normalizeBasePath(DEFAULT_NAKAMA_CONFIG.basePath) };
  }

  public getSession(): Session | null {
    return this.session;
  }

  private get address(): string {
    return formatServerAddress(this.config);
  }

  private basicAuth(): string {
    return `Basic ${btoa(`${this.config.serverKey}:`)}`;
  }

  /**
   * Dispatches an HTTP request via Electron IPC (native Node.js) to bypass CORS / Chromium limitations,
   * falling back to standard fetch if in browser.
   */
  private async apiRequest(
    path: string,
    method = 'GET',
    headers: Record<string, string> = {},
    body?: unknown,
    timeoutMs = 7000
  ): Promise<ApiResponse> {
    const url = `${this.address}${path}`;

    if (typeof window !== 'undefined' && window.electronAPI?.nakamaRequest) {
      return window.electronAPI.nakamaRequest({ url, method, headers, body, timeoutMs });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, {
        method,
        headers,
        body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);
      const text = await resp.text();
      return { ok: resp.ok, status: resp.status, statusText: resp.statusText, data: text };
    } catch (err: unknown) {
      clearTimeout(timer);
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      const msg = aborted ? 'Connection timed out' : err instanceof Error ? err.message : String(err);
      return { ok: false, status: 0, statusText: msg, data: '' };
    }
  }

  /** Turns a failed response into one sentence the player can act on. */
  private explain(res: ApiResponse, context: 'login' | 'register' | 'other' = 'other'): string {
    const addr = this.address;
    const body = parseJson(res.data);
    const apiMessage = typeof body?.message === 'string' ? body.message : '';

    if (res.status === 0) {
      const raw = res.statusText || '';
      if (/timed out|timeout/i.test(raw)) {
        return `No reply from ${addr}. Check the address and that the server is running.`;
      }
      if (/ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(raw)) {
        return `Can't find ${this.config.host}. Check the address for typos and your internet connection.`;
      }
      if (/ECONNREFUSED/i.test(raw)) {
        return `${addr} refused the connection. Nothing is listening on that port.`;
      }
      if (/cert|ssl|tls|self.signed|EPROTO|wrong version/i.test(raw)) {
        return `Secure connection to ${this.config.host} failed. Check that "Use SSL" matches the server.`;
      }
      return `Could not reach ${addr}${raw ? ` (${raw})` : ''}.`;
    }

    if (res.status >= 520 && res.status <= 524) {
      return `The gateway at ${this.config.host} can't reach Nakama (status ${res.status}).`;
    }
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      return `The gateway at ${this.config.host} can't reach Nakama (status ${res.status}).`;
    }
    if (res.status >= 500) {
      return `Nakama hit an error (status ${res.status}). Try again in a moment.`;
    }

    // A route that doesn't lead to Nakama answers with an empty body or a generic "Not Found".
    if (res.status === 404 && (!apiMessage || /^not found$/i.test(apiMessage))) {
      return `Reached ${this.config.host}, but not the Nakama game API (path not found). Check the address and base path.`;
    }
    if (/server key/i.test(apiMessage)) {
      return 'Server key rejected. Check the server key in Settings.';
    }
    if (res.status === 401 || res.status === 403 || /invalid credentials/i.test(apiMessage)) {
      return context === 'other' ? 'Not authorized by Nakama.' : 'Wrong email or password.';
    }
    if (res.status === 409) {
      return 'That email or callsign is already taken.';
    }
    if (res.status === 400 && apiMessage) {
      return apiMessage;
    }
    return apiMessage || `Nakama replied with status ${res.status}.`;
  }

  /**
   * Checks that the address leads to Nakama's game API (not a console or an unrelated page).
   */
  public async testConnection(): Promise<{ ok: boolean; message: string }> {
    const res = await this.apiRequest('/healthcheck', 'GET', {}, undefined, 5000);

    if (res.ok) {
      const text = res.data.trim();
      if (text.startsWith('<')) {
        return {
          ok: false,
          message: `${this.config.host} answered with a web page, not the game API. This may be the admin console (port 7351).`,
        };
      }
      return { ok: true, message: `Nakama is online at ${this.address}` };
    }
    return { ok: false, message: this.explain(res) };
  }

  private async completeAuth(res: ApiResponse, context: 'login' | 'register' | 'other'): Promise<Session> {
    if (res.ok && res.data) {
      const json = parseJson(res.data);
      if (json && typeof json.token === 'string') {
        const session = Session.restore(json.token, typeof json.refresh_token === 'string' ? json.refresh_token : '');
        this.setSession(session);
        return session;
      }
      throw new Error(`${this.config.host} replied, but not with a Nakama session. Check the address and base path.`);
    }
    throw new Error(this.explain(res, context));
  }

  /**
   * Authenticate user with Email & Password
   */
  public async authenticateEmail(
    email: string,
    pass: string,
    createAccount = false,
    username?: string
  ): Promise<Session> {
    const query = new URLSearchParams({ create: String(createAccount) });
    if (username) query.set('username', username);

    const res = await this.apiRequest(
      `/v2/account/authenticate/email?${query.toString()}`,
      'POST',
      { 'Content-Type': 'application/json', Authorization: this.basicAuth() },
      { email, password: pass },
      8000
    );
    return this.completeAuth(res, createAccount ? 'register' : 'login');
  }

  /**
   * Authenticate device / guest session
   */
  public async authenticateDevice(deviceId: string, createAccount = true, username?: string): Promise<Session> {
    const query = new URLSearchParams({ create: String(createAccount) });
    if (username) query.set('username', username);

    const res = await this.apiRequest(
      `/v2/account/authenticate/device?${query.toString()}`,
      'POST',
      { 'Content-Type': 'application/json', Authorization: this.basicAuth() },
      { id: deviceId },
      8000
    );
    return this.completeAuth(res, 'other');
  }

  /**
   * Set and persist active session
   */
  public setSession(session: Session | null) {
    this.session = session;
    try {
      if (session) {
        localStorage.setItem(STORAGE_KEY_TOKEN, session.token);
        if (session.refresh_token) localStorage.setItem(STORAGE_KEY_REFRESH, session.refresh_token);
      } else {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_REFRESH);
      }
    } catch {
      // localStorage disabled
    }
  }

  /**
   * Restore existing session from localStorage, refreshing it if it has expired.
   */
  public async restoreSession(): Promise<Session | null> {
    try {
      const token = localStorage.getItem(STORAGE_KEY_TOKEN);
      const refreshToken = localStorage.getItem(STORAGE_KEY_REFRESH) || '';
      if (!token) return null;

      const restored = Session.restore(token, refreshToken);
      if (!restored.isexpired(Date.now() / 1000)) {
        this.session = restored;
        return restored;
      }

      if (refreshToken && !restored.isrefreshexpired(Date.now() / 1000)) {
        const res = await this.apiRequest(
          '/v2/account/session/refresh',
          'POST',
          { 'Content-Type': 'application/json', Authorization: this.basicAuth() },
          { token: refreshToken },
          8000
        );
        const json = res.ok ? parseJson(res.data) : null;
        if (json && typeof json.token === 'string') {
          const refreshed = Session.restore(json.token, typeof json.refresh_token === 'string' ? json.refresh_token : refreshToken);
          this.setSession(refreshed);
          return refreshed;
        }
      }
      this.setSession(null);
      return null;
    } catch {
      this.setSession(null);
      return null;
    }
  }

  /**
   * Fetch Nakama account profile
   */
  public async getAccount(): Promise<UserProfile | null> {
    if (!this.session) return null;
    const session = this.session;
    const fromSession = (): UserProfile => {
      const username = session.username || 'Operative';
      return {
        id: session.user_id || 'usr_anonymous',
        callsign: username,
        rank: 'VERIFIED OPERATIVE',
        level: 1,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
        status: 'ONLINE',
        walletBalance: 100.0,
        role: 'OPERATOR',
        ownedGameIds: ['railbound'],
        nakamaToken: session.token,
        nakamaRefreshToken: session.refresh_token,
      };
    };

    try {
      const res = await this.apiRequest(
        '/v2/account',
        'GET',
        { Authorization: `Bearer ${session.token}` },
        undefined,
        5000
      );
      const account = res.ok ? parseJson(res.data) : null;
      const user = account?.user as { username?: string; id?: string; avatar_url?: string } | undefined;
      if (user) {
        const username = user.username || session.username || 'Operative';
        return {
          ...fromSession(),
          id: user.id || session.user_id || 'usr_anonymous',
          callsign: username,
          email: (account?.email as string | undefined) || `${username.toLowerCase()}@oneengine.io`,
          avatarUrl: user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
        };
      }
    } catch {
      // fall through to the session-derived profile
    }
    return fromSession();
  }

  /**
   * Claim or purchase a game into Nakama user library
   */
  public async claimGameEntitlement(gameId: string): Promise<boolean> {
    if (!this.session) return false;
    try {
      const res = await this.apiRequest(
        '/v2/storage',
        'PUT',
        { 'Content-Type': 'application/json', Authorization: `Bearer ${this.session.token}` },
        {
          objects: [
            {
              collection: 'library',
              key: gameId,
              value: JSON.stringify({ acquiredAt: new Date().toISOString(), store: 'OneEngine' }),
              permission_read: 1,
              permission_write: 1,
            },
          ],
        },
        6000
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  public logout() {
    this.setSession(null);
  }
}

export const nakamaService = new NakamaService();
