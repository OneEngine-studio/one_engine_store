# Coin purchases (Stripe)

The launcher sells coin bundles through the **payments service**
([OneEngine-studio/railbound-payment](https://github.com/OneEngine-studio/railbound-payment), branch
`oneengine-launcher-payments`). The launcher never sees a card number or a Stripe key: it opens Stripe's own
checkout page in the system browser and the service credits coins only after Stripe's signed webhook confirms
the payment.

## How a purchase flows

1. The player opens **Coins** in the launcher and picks a bundle.
2. The launcher's main process (`electron/payments.cjs`) trades the player's OneEngine sign-in for a payments
   session. The payments service checks that sign-in against the Platform API (`GET /v1/me`); the email must be
   confirmed.
3. The service creates an order and a Stripe Checkout Session. The launcher opens it only if the address is
   `https://checkout.stripe.com/...`.
4. The player pays on Stripe's page. Stripe calls `POST /api/v1/payments/webhooks/stripe`; the service verifies the
   `Stripe-Signature` header and that amount, currency and session match the order, then credits the wallet once.
5. The Coins screen watches the order and shows the new balance as soon as it is `COMPLETED`.

## Payments service settings

Set these on the server that runs the payments service. Never commit real values.

| Variable | Meaning |
| --- | --- |
| `PUBLIC_BASE_URL` | Public https address of the payments service (Stripe sends the player's browser back here). |
| `ONEENGINE_API_URL` | The Platform API that vouches for launcher sign-ins, e.g. `https://api.13-236-184-157.sslip.io`. |
| `STRIPE_SECRET_KEY` | Stripe secret key. Use `sk_test_...` until everything is tested. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of the webhook endpoint (`whsec_...`). |
| `JWT_SECRET` | Long random value; signs payments sessions. Rotate the old value from the repository history. |
| `INTERNAL_SERVICE_KEY` | Long random value for game-server calls. Rotate the old value too. |
| `APP_DEV_ENDPOINTS_ENABLED` | Leave unset (false) in production. `true` only on a developer machine. |

In the Stripe dashboard, add a webhook endpoint pointing at
`https://<PUBLIC_BASE_URL>/api/v1/payments/webhooks/stripe` with the events `checkout.session.completed` and
`checkout.session.async_payment_succeeded`.

## Launcher build

Payments are optional per build. Without an address the Coins item does not appear in the navigation.

```bash
PLATFORM_API_URL=https://api.example.com PAYMENTS_API_URL=https://pay.example.com npm run dist
```

During development set `ONEENGINE_PAYMENTS_URL` instead, or add `"paymentsApiUrl"` to `electron/app-config.json`.

## Testing before going live

1. Run the service with Stripe test keys and the Stripe CLI forwarding webhooks:
   `stripe listen --forward-to localhost:8080/api/v1/payments/webhooks/stripe`.
2. Buy a bundle in the launcher with Stripe's test card `4242 4242 4242 4242`.
3. Check that the balance updates, that a second delivery of the same webhook does not credit twice, and that a
   cancelled checkout leaves the balance unchanged.
