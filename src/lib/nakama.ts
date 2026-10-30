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
   * Quick connection / healthcheck verification
   */
  public async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const url = `${this.config.useSsl ? 'https' : 'http'}://${this.config.host}:${this.config.port}/`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${btoa(this.config.serverKey + ':')}`,
        },
        signal: controller.signal,
      }).catch((err) => {
        return { ok: false, status: 0, statusText: err.message };
      });

      clearTimeout(timeoutId);

      if (resp && 'status' in resp && resp.status !== 0) {
        return { ok: true, message: `Connected to Nakama (${this.config.host}:${this.config.port})` };
      }
      return { ok: false, message: 'Server unreachable or refused connection' };
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
    const session = await this.client.authenticateEmail(
      email,
      pass,
      createAccount,
      username
    );
    this.setSession(session);
    return session;
  }

  /**
   * Authenticate device / guest session
   */
  public async authenticateDevice(deviceId: string, createAccount = true, username?: string): Promise<Session> {
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
          // Attempt refresh
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
      const account = await this.client.getAccount(this.session);
      const user = account.user;
      const username = user?.username || this.session.username || 'Operative';
      const userId = user?.id || this.session.user_id || 'usr_anonymous';
      const avatarUrl =
        user?.avatar_url ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;

      // Read owned games from Nakama storage "library" collection
      const owned = await this.fetchOwnedGames(userId);

      return {
        id: userId,
        callsign: username,
        email: account.email || `${username.toLowerCase()}@oneengine.io`,
        rank: 'VERIFIED OPERATIVE',
        level: 1,
        avatarUrl,
        status: 'ONLINE',
        walletBalance: 100.00,
        role: 'OPERATOR',
        ownedGameIds: owned.length > 0 ? owned : ['railbound'],
        nakamaToken: this.session.token,
        nakamaRefreshToken: this.session.refresh_token,
      };
    } catch {
      // Fallback profile if server account fetch fails
      const username = this.session.username || 'Operative';
      return {
        id: this.session.user_id || 'usr_anonymous',
        callsign: username,
        rank: 'VERIFIED OPERATIVE',
        level: 1,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
        status: 'ONLINE',
        walletBalance: 100.00,
        role: 'OPERATOR',
        ownedGameIds: ['railbound'],
        nakamaToken: this.session.token,
        nakamaRefreshToken: this.session.refresh_token,
      };
    }
  }

  /**
   * Fetch game entitlements from Nakama storage "library" collection
   */
  public async fetchOwnedGames(userId: string): Promise<string[]> {
    if (!this.session) return ['railbound'];
    try {
      const objects = await this.client.readStorageObjects(this.session, {
        object_ids: [
          { collection: 'library', key: 'railbound', user_id: userId },
          { collection: 'library', key: 'cyber-siege', user_id: userId },
          { collection: 'library', key: 'rust-protocol', user_id: userId },
          { collection: 'library', key: 'neon-drifter', user_id: userId },
        ],
      });

      if (objects.objects && objects.objects.length > 0) {
        return objects.objects.map((o) => o.key).filter((k): k is string => Boolean(k));
      }
      return ['railbound'];
    } catch {
      return ['railbound'];
    }
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
          permission_read: 1, // public read
          permission_write: 1, // owner write
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
