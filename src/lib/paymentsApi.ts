// Client for the OneEngine payments service (coin bundles, wallet, Stripe checkout).
// Every call goes through the desktop app's main process (electron/payments.cjs), which holds the session,
// only forwards a fixed set of routes and opens Stripe's checkout page itself. There is no browser fallback:
// outside the desktop app the screen simply reports that payments are unavailable.

export interface CoinBundle {
  sku: string;
  title: string;
  baseCoins: number;
  bonusCoins: number;
  totalCoins: number;
  fiatAmountMinor: number;
  currency: string;
  badgeText?: string | null;
  sortOrder?: number;
}

export interface Wallet {
  realCoins: number;
  gameCoins: number;
}

export type OrderStatus = 'CREATED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';

export interface PaymentOrderInfo {
  orderId: string;
  status: OrderStatus;
  bundleSku: string;
  coinsToCredit: number;
  amountMinor: number;
  currency: string;
  createdAt?: string;
  completedAt?: string | null;
}

export class PaymentsError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

interface Reply {
  status: number;
  data: Record<string, unknown>;
}

const bridge = () => (typeof window !== 'undefined' ? window.electronAPI?.payments : undefined);

async function call<T>(path: string, method = 'GET', body?: unknown, idempotencyKey?: string): Promise<T> {
  const b = bridge();
  if (!b) throw new PaymentsError('Payments are only available in the OneEngine desktop app.', 0);
  const res = (await b.request({ path, method, body, idempotencyKey })) as Reply;
  if (res.status >= 200 && res.status < 300) return res.data as T;
  const err = res.data as { error?: { message?: string }; message?: string };
  throw new PaymentsError(err?.error?.message || err?.message || 'Payments are not available right now.', res.status);
}

const newKey = () => `chk_${crypto.randomUUID().replace(/-/g, '')}`;

export const paymentsApi = {
  isAvailable: () => !!bridge(),
  bundles: () => call<CoinBundle[]>('/api/v1/coin-bundles'),
  wallet: () => call<Wallet>('/api/v1/wallet/me'),
  orders: () => call<PaymentOrderInfo[]>('/api/v1/payments/orders'),
  order: (orderId: string) => call<PaymentOrderInfo>(`/api/v1/payments/orders/${encodeURIComponent(orderId)}`),
  /** Creates the order and has the desktop app open Stripe's checkout page in the system browser. */
  checkout: (bundleSku: string) =>
    call<{ orderId: string; status: OrderStatus; opened: boolean }>('/api/v1/payments/checkout-sessions', 'POST', { bundleSku }, newKey()),
};

export const formatMoney = (minor: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
};
