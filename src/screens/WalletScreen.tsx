import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, Receipt } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Icon3D, Icon3DKind } from '../components/ui/Icon3D';
import { playUiSound } from '../lib/uiSound';
import {
  CoinBundle,
  PaymentOrderInfo,
  PaymentsError,
  Wallet,
  formatMoney,
  paymentsApi,
} from '../lib/paymentsApi';

const KINDS: Icon3DKind[] = ['bolt', 'controller', 'trophy', 'rocket', 'target'];
const POLL_MS = 3000;
const POLL_LIMIT_MS = 10 * 60 * 1000;

const statusText: Record<string, string> = {
  COMPLETED: 'Paid',
  PENDING: 'Waiting for payment',
  PROCESSING: 'Processing',
  CREATED: 'Waiting for payment',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  REFUNDED: 'Refunded',
};

export const WalletScreen: React.FC = () => {
  const { isAuthenticated, currentUser, openAuthModal, settings } = useStore();
  const signedIn = isAuthenticated && !!currentUser.id;

  const [bundles, setBundles] = useState<CoinBundle[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [orders, setOrders] = useState<PaymentOrderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [buying, setBuying] = useState<string | null>(null);
  const [waitingFor, setWaitingFor] = useState<string | null>(null);
  const soundOn = useRef(settings.enableTactileAudio);
  soundOn.current = settings.enableTactileAudio;

  const loadAccount = useCallback(async () => {
    const [w, o] = await Promise.all([paymentsApi.wallet(), paymentsApi.orders()]);
    setWallet(w);
    setOrders(o.slice(0, 6));
  }, []);

  // Bundles are public; the wallet and orders need the player signed in (and a confirmed email).
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const list = await paymentsApi.bundles();
        if (active) setBundles([...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
        if (signedIn) await loadAccount();
        else if (active) {
          setWallet(null);
          setOrders([]);
        }
      } catch (e) {
        if (active) setError(e instanceof PaymentsError ? e.message : 'Payments are not available right now.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [signedIn, loadAccount]);

  // After Stripe opens, watch the order until the webhook has credited it. The coins only ever come from the server.
  useEffect(() => {
    if (!waitingFor) return;
    let stopped = false;
    const started = Date.now();
    const tick = async () => {
      try {
        const order = await paymentsApi.order(waitingFor);
        if (stopped) return;
        if (order.status === 'COMPLETED') {
          setWaitingFor(null);
          setNotice(`${order.coinsToCredit.toLocaleString()} coins added to your wallet.`);
          playUiSound('purchase', soundOn.current);
          void loadAccount().catch(() => undefined);
          return;
        }
        if (['FAILED', 'CANCELLED', 'EXPIRED'].includes(order.status)) {
          setWaitingFor(null);
          setError(`The payment ${statusText[order.status].toLowerCase()}. You were not charged.`);
          void loadAccount().catch(() => undefined);
          return;
        }
      } catch {
        // a missed poll is fine; the next one tries again
      }
      if (!stopped && Date.now() - started > POLL_LIMIT_MS) {
        setWaitingFor(null);
        setNotice('Still waiting for the payment? If you paid, your coins will appear here shortly.');
        return;
      }
      if (!stopped) timer = setTimeout(tick, POLL_MS);
    };
    let timer = setTimeout(tick, POLL_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [waitingFor, loadAccount]);

  const buy = async (bundle: CoinBundle) => {
    if (!signedIn) {
      openAuthModal();
      return;
    }
    setError('');
    setNotice('');
    setBuying(bundle.sku);
    try {
      const res = await paymentsApi.checkout(bundle.sku);
      playUiSound('click', soundOn.current);
      setWaitingFor(res.orderId);
    } catch (e) {
      setError(e instanceof PaymentsError ? e.message : 'The payment page could not be opened.');
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-cream">Coins</h1>
          <p className="text-xs text-slate-400 mt-1">Top up with a card in Stripe's secure checkout. Coins are added once the payment is confirmed.</p>
        </div>
        <div className="rounded-[22px] bg-bg-card border border-white/[0.06] px-6 py-4 min-w-[200px]">
          <span className="text-xs text-slate-400 block">Your balance</span>
          <span className="font-display text-3xl text-cream tabular-nums">{wallet ? wallet.realCoins.toLocaleString() : signedIn ? '…' : '—'}</span>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-xs flex items-start gap-2.5 text-slate-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}
      {notice && (
        <div role="status" className="p-3 rounded-xl bg-success/10 border border-success/30 text-xs flex items-start gap-2.5 text-slate-200">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-success" />
          <span className="leading-relaxed">{notice}</span>
        </div>
      )}
      {waitingFor && (
        <div role="status" className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs flex items-center gap-3 text-slate-200">
          <Loader2 className="w-4 h-4 animate-spin text-accent" />
          <span>Finish paying in your browser. This page updates by itself when the payment is confirmed.</span>
        </div>
      )}

      {!signedIn && (
        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 flex items-center justify-between gap-4">
          <span>Sign in with your OneEngine account to buy coins.</span>
          <button onClick={openAuthModal} className="px-4 h-9 rounded-full bg-accent hover:bg-accent-hover text-white font-semibold cursor-default active:scale-[0.97] transition-[background-color,transform]">
            Sign in
          </button>
        </div>
      )}

      <section className="space-y-5">
        <h2 className="font-display text-2xl text-cream">Coin bundles</h2>
        {loading ? (
          <p className="text-xs text-slate-400">Loading bundles…</p>
        ) : bundles.length === 0 ? (
          <p className="text-xs text-slate-400">No bundles are on sale right now.</p>
        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {bundles.map((b, i) => (
              <div
                key={b.sku}
                className="relative overflow-hidden rounded-[26px] border border-white/[0.08] p-5 flex flex-col gap-4 animate-soft-enter"
                style={{
                  animationDelay: `${Math.min(i, 8) * 45}ms`,
                  background: 'linear-gradient(150deg, #5A1C20, #2A1113 78%)',
                }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(80%_80%_at_85%_0%,rgba(226,90,90,0.28),transparent_65%)] pointer-events-none" />
                {b.badgeText && (
                  <span className="absolute top-4 left-4 h-6 px-2.5 inline-flex items-center rounded-full bg-white text-[#361518] text-xs font-semibold">{b.badgeText}</span>
                )}
                <Icon3D kind={KINDS[i % KINDS.length]} className="relative w-20 h-auto self-end" />
                <div className="relative">
                  <div className="font-display text-2xl text-white tabular-nums">{b.totalCoins.toLocaleString()}</div>
                  <div className="text-xs text-slate-300">
                    {b.bonusCoins > 0 ? `${b.baseCoins.toLocaleString()} + ${b.bonusCoins.toLocaleString()} bonus coins` : 'coins'}
                  </div>
                </div>
                <button
                  onClick={() => void buy(b)}
                  disabled={buying !== null || !!waitingFor}
                  className="relative h-11 rounded-xl bg-gradient-to-b from-[#CC4545] to-accent hover:from-[#D45050] hover:to-[#B13636] text-white text-sm font-bold shadow-glow cursor-default active:scale-[0.98] transition-[filter,transform] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {buying === b.sku && <Loader2 className="w-4 h-4 animate-spin" />}
                  {formatMoney(b.fiatAmountMinor, b.currency)}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {signedIn && orders.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl text-cream flex items-center gap-2">
            <Receipt className="w-5 h-5 text-accent" /> Recent purchases
          </h2>
          <ul className="space-y-2">
            {orders.map((o) => (
              <li key={o.orderId} className="rounded-[22px] bg-bg-card border border-white/[0.06] px-5 py-3 flex items-center justify-between gap-4 text-xs">
                <span className="text-slate-200 tabular-nums">{o.coinsToCredit.toLocaleString()} coins</span>
                <span className="text-slate-400 tabular-nums">{formatMoney(o.amountMinor, o.currency)}</span>
                <span className={o.status === 'COMPLETED' ? 'text-success font-semibold' : 'text-slate-400'}>{statusText[o.status] ?? o.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
