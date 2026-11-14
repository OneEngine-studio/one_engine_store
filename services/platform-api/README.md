# OneEngine Platform API (development version)

Node 22.5+ (uses the built-in `node:sqlite`), Fastify, TypeScript.

```bash
npm install
npm test            # 19 tests: catalog, auth, library, tickets, rate limit, builds, depot
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

## Publishing a build (development)

```bash
npm run publish-build -- railbound 2.4.0 /path/to/railbound.zip
```

Copies the zip into `DEPOT_DIR` (default `./data/depot`) and registers it with its size and sha256.
Owners then get it from `GET /v1/products/:id/builds/latest`, which returns a 10-minute signed link to
`/v1/depot/...` (supports byte ranges for resumable downloads). In production a CDN checks the same
token and serves the same path. Set `PUBLIC_BASE_URL` if the API sits behind a proxy.

## Production switches

With `NODE_ENV=production` the server refuses to start unless `ALLOW_DEV_LOGIN` is off, `IDP_JWKS_URL`
and `IDP_ISSUER` are set, and the two keys are random values of 32+ characters.

## Not built yet

Postgres and Redis (SQLite and in-memory tickets stand in), payments, depot/build publishing,
reviews, wishlist, admin portal. The table layout already follows the full guide.
