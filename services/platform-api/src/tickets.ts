import { createHash, randomBytes } from 'node:crypto';

export interface TicketPayload {
  userId: string;
  displayName: string;
  productId: string;
  deviceId: string;
}

interface Entry extends TicketPayload {
  expiresAt: number;
}

export const TICKET_TTL_MS = 60_000;

const hash = (ticket: string) => createHash('sha256').update(ticket).digest('hex');

/**
 * Single-use launch tickets. In memory for now; swap this class for a Redis version
 * (SET key EX 60 NX / GETDEL) when the API runs on more than one instance.
 */
export class TicketStore {
  private entries = new Map<string, Entry>();

  constructor(private now: () => number = Date.now) {}

  static hash = hash;

  issue(payload: TicketPayload): { ticket: string; ticketHash: string; expiresAt: number } {
    this.sweep();
    const ticket = randomBytes(32).toString('base64url');
    const expiresAt = this.now() + TICKET_TTL_MS;
    const ticketHash = hash(ticket);
    this.entries.set(ticketHash, { ...payload, expiresAt });
    return { ticket, ticketHash, expiresAt };
  }

  /** Returns the payload once; the ticket is gone afterwards, valid or not. */
  redeem(ticket: string): TicketPayload | null {
    const key = hash(ticket);
    const entry = this.entries.get(key);
    this.entries.delete(key);
    if (!entry || entry.expiresAt < this.now()) return null;
    const { expiresAt: _expiresAt, ...payload } = entry;
    return payload;
  }

  private sweep() {
    const t = this.now();
    for (const [k, v] of this.entries) if (v.expiresAt < t) this.entries.delete(k);
  }
}

/** Fixed-window limiter, per key. */
export class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private limit: number,
    private windowMs: number,
    private now: () => number = Date.now
  ) {}

  allow(key: string): boolean {
    const t = this.now();
    const cur = this.hits.get(key);
    if (!cur || cur.resetAt < t) {
      this.hits.set(key, { count: 1, resetAt: t + this.windowMs });
      return true;
    }
    cur.count += 1;
    return cur.count <= this.limit;
  }
}
