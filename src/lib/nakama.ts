import { Client, Session } from '@heroiclabs/nakama-js';
import { UserProfile } from '../types/store';

export interface NakamaConfig {
  host: string;
  port: string;
  useSsl: boolean;
  serverKey: string;
}

const STORAGE_KEY_TOKEN = 'nakama_session_token';
const STORAGE_KEY_REFRESH = 'nakama_refresh_token';
const STORAGE_KEY_CONFIG = 'nakama_server_config';

export const DEFAULT_NAKAMA_CONFIG: NakamaConfig = {
  host: import.meta.env.VITE_NAKAMA_HOST || '161.118.227.105',
  port: import.meta.env.VITE_NAKAMA_PORT || '7350',
  useSsl: import.meta.env.VITE_NAKAMA_SSL === 'true',
  serverKey: import.meta.env.VITE_NAKAMA_SERVER_KEY || 'defaultkey',
};

class NakamaService {
  private client: Client;
  private session: Session | null = null;
  private config: NakamaConfig;

  constructor() {
    this.config = this.loadConfig();
    this.client = new Client(
      this.config.serverKey,
      this.config.host,
      this.config.port,
      this.config.useSsl
    );
  }

  public getConfig(): NakamaConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<NakamaConfig>) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch {
      // ignore
    }
    this.client = new Client(
      this.config.serverKey,
      this.config.host,
      this.config.port,
      this.config.useSsl
    );
  }

  private loadConfig(): NakamaConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        return { ...DEFAULT_NAKAMA_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_NAKAMA_CONFIG;
  }

  public getSession(): Session | null {
    return this.session;
  }

  public getClient(): Client {
    return this.client;
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
  ): Promise<{ ok: boolean; status: number; statusText: string; data: string }> {
    const url = `${this.config.useSsl ? 'https' : 'http'}://${this.config.host}:${this.config.port}${path}`;

    if (typeof window !== 'undefined' && window.electronAPI?.nakamaRequest) {
      return window.electronAPI.nakamaRequest({
        url,
        method,
        headers,
        body,
        timeoutMs,
      });
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
      return {
        ok: resp.ok,
        status: resp.status,
        statusText: resp.statusText,
        data: text,
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        status: 0,
        statusText: msg,
        data: '',
      };
    }
  }

  /**
   * Healthcheck verification
   */
  public async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const basicAuth = btoa(`${this.config.serverKey}:`);
      const res = await this.apiRequest(
        '/',
        'GET',
        { Authorization: `Basic ${basicAuth}` },
        undefined,
        4000
      );

      if (res.status !== 0) {
        return { ok: true, message: `Connected to Nakama (${this.config.host}:${this.config.port})` };
      }
      return {
        ok: false,
        message: `Port ${this.config.port} on ${this.config.host} is unreachable (Connection timed out).`,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, message: msg };
    }
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
    const query = new URLSearchParams({
      create: String(createAccount),
    });
    if (username) {
      query.set('username', username);
    }

    const path = `/v2/account/authenticate/email?${query.toString()}`;
    const basicAuth = btoa(`${this.config.serverKey}:`);

    const res = await this.apiRequest(
      path,
      'POST',
      {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      {
        email,
        password: pass,
      },
      8000
    );

    if (res.ok && res.data) {
      try {
        const json = JSON.parse(res.data);
        const session = Session.restore(json.token, json.refresh_token);
        this.setSession(session);
        return session;
      } catch {
        throw new Error('Failed to parse Nakama session token.');
      }
    }

    if (res.status === 0) {
      throw new Error(
        `Connection timed out to ${this.config.host}:${this.config.port}. If your server is on Oracle Cloud, ensure port 7350 is allowed in VCN Ingress Rules & OS firewall.`
      );
    }

    let errorDetail = res.statusText;
    if (res.data) {
      try {
        const errJson = JSON.parse(res.data);
        if (errJson.message) errorDetail = errJson.message;
      } catch {
        // ignore
      }
    }

    throw new Error(errorDetail || `Authentication failed (status ${res.status}).`);
  }

  /**
   * Authenticate device / guest session
   */
  public async authenticateDevice(deviceId: string, createAccount = true, username?: string): Promise<Session> {
    const query = new URLSearchParams({
      create: String(createAccount),
    });
    if (username) query.set('username', username);

    const path = `/v2/account/authenticate/device?${query.toString()}`;
    const basicAuth = btoa(`${this.config.serverKey}:`);

    const res = await this.apiRequest(
      path,
      'POST',
      {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      { id: deviceId },
      6000
    );

    if (res.ok && res.data) {
      const json = JSON.parse(res.data);
      const session = Session.restore(json.token, json.refresh_token);
      this.setSession(session);
      return session;
    }

    // Fallback to client SDK
    const session = await this.client.authenticateDevice(deviceId, createAccount, username);
    this.setSession(session);
    return session;
  }

  /**
   * Set and persist active session
   */
  public setSession(session: Session | null) {
    this.session = session;
    if (session) {
      try {
        localStorage.setItem(STORAGE_KEY_TOKEN, session.token);
        if (session.refresh_token) {
          localStorage.setItem(STORAGE_KEY_REFRESH, session.refresh_token);
        }
      } catch {
        // localStorage disabled
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_REFRESH);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Restore existing session from localStorage
   */
  public async restoreSession(): Promise<Session | null> {
    try {
      const token = localStorage.getItem(STORAGE_KEY_TOKEN);
      const refreshToken = localStorage.getItem(STORAGE_KEY_REFRESH) || '';
      if (!token) return null;

      const restored = Session.restore(token, refreshToken);
      if (restored.isexpired(Date.now() / 1000)) {
        if (refreshToken) {
          const refreshed = await this.client.sessionRefresh(restored);
          this.setSession(refreshed);
          return refreshed;
        }
        this.setSession(null);
        return null;
      }

      this.session = restored;
      return restored;
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
    try {
      const res = await this.apiRequest(
        '/v2/account',
        'GET',
        {
          Authorization: `Bearer ${this.session.token}`,
        },
        undefined,
        5000
      );

      if (res.ok && res.data) {
        const account = JSON.parse(res.data);
        const user = account.user;
        const username = user?.username || this.session.username || 'Operative';
        const userId = user?.id || this.session.user_id || 'usr_anonymous';
        const avatarUrl =
          user?.avatar_url ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;

        return {
          id: userId,
          callsign: username,
          email: account.email || `${username.toLowerCase()}@oneengine.io`,
          rank: 'VERIFIED OPERATIVE',
          level: 1,
          avatarUrl,
          status: 'ONLINE',
          walletBalance: 100.0,
          role: 'OPERATOR',
          ownedGameIds: ['railbound'],
          nakamaToken: this.session.token,
          nakamaRefreshToken: this.session.refresh_token,
        };
      }
    } catch {
      // Fallback
    }

    const username = this.session.username || 'Operative';
    return {
      id: this.session.user_id || 'usr_anonymous',
      callsign: username,
      rank: 'VERIFIED OPERATIVE',
      level: 1,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      status: 'ONLINE',
      walletBalance: 100.0,
      role: 'OPERATOR',
      ownedGameIds: ['railbound'],
      nakamaToken: this.session.token,
      nakamaRefreshToken: this.session.refresh_token,
    };
  }

  /**
   * Claim or purchase a game into Nakama user library
   */
  public async claimGameEntitlement(gameId: string): Promise<boolean> {
    if (!this.session) return false;
    try {
      await this.client.writeStorageObjects(this.session, [
        {
          collection: 'library',
          key: gameId,
          value: {
            acquiredAt: new Date().toISOString(),
            store: 'OneEngine',
          },
          permission_read: 1,
          permission_write: 1,
        },
      ]);
      return true;
    } catch {
      return false;
    }
  }

  public logout() {
    this.setSession(null);
  }
}

export const nakamaService = new NakamaService();
