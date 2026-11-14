# OneEngine Platform API (development version)

Node 22.5+ (uses the built-in `node:sqlite`), Fastify, TypeScript.

```bash
npm install
npm test            # 12 tests: catalog, auth, library, tickets, rate limit
npm run dev         # http://127.0.0.1:8080
```

Dev mode needs `ALLOW_DEV_LOGIN=true` (see `.env.example`). Without it there is no sign-in at all,
because the real identity provider is not connected yet.

## Try it

```bash
# 1. sign in (dev)
curl -s -X POST localhost:8080/v1/dev/login -H 'content-type: application/json' \
  -d '{"email":"me@example.com","displayName":"Me"}'
# 2. use the accessToken
curl -s -X POST localhost:8080/v1/library/railbound/claim -H "authorization: Bearer $TOKEN"
curl -s -X POST localhost:8080/v1/launch-tickets -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{"productId":"railbound","deviceId":"my-device-0001"}'
```

## Production switches

With `NODE_ENV=production` the server refuses to start unless `ALLOW_DEV_LOGIN` is off, `IDP_JWKS_URL`
and `IDP_ISSUER` are set, and the two keys are random values of 32+ characters.

## Not built yet

Postgres and Redis (SQLite and in-memory tickets stand in), payments, depot/build publishing,
reviews, wishlist, admin portal. The table layout already follows the full guide.
