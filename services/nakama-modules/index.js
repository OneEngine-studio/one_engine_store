// OneEngine ticket sign-in for Nakama (JavaScript runtime).
//
// Copy this file into Nakama's runtime modules folder (the `--runtime.path` directory) and set
// these environment values for the Nakama process (runtime.env / Kubernetes secret):
//   PLATFORM_API_URL      e.g. https://api.example.com
//   PLATFORM_SERVICE_KEY  same value as the Platform API's PLATFORM_SERVICE_KEY
//   ALLOW_DIRECT_AUTH     "true" ONLY on the dev server; unset in stage and prod
//
// The game signs in with AuthenticateCustom(id = launch ticket). The hook below swaps the ticket
// for a stable "oe:<userId>" identity after the Platform API confirms it is valid and the player
// owns the game. Direct email and device sign-in are refused unless ALLOW_DIRECT_AUTH is "true".

function beforeAuthenticateCustom(ctx, logger, nk, data) {
  var ticket = data.account && data.account.id;
  if (!ticket) throw Error('ticket required');

  var res = nk.httpRequest(
    ctx.env['PLATFORM_API_URL'] + '/internal/tickets/redeem',
    'post',
    {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + ctx.env['PLATFORM_SERVICE_KEY'],
    },
    JSON.stringify({ ticket: ticket }),
    3000
  );
  if (res.code !== 200) {
    logger.warn('ticket redeem refused: %d', res.code);
    throw Error('invalid or expired ticket');
  }

  var t = JSON.parse(res.body); // { userId, displayName, productId, entitled }
  if (!t.entitled) throw Error('game not owned');

  data.account.id = 'oe:' + t.userId;
  data.account.vars = { product: t.productId, ent: '1', oe_user: t.userId };
  data.create = true;
  if (!data.username) data.username = t.displayName;
  return data;
}

function denyDirectAuth(ctx, logger, nk, data) {
  if (ctx.env['ALLOW_DIRECT_AUTH'] === 'true') return data;
  throw Error('sign in through the OneEngine Store');
}

function InitModule(ctx, logger, nk, initializer) {
  initializer.registerBeforeAuthenticateCustom(beforeAuthenticateCustom);
  initializer.registerBeforeAuthenticateDevice(denyDirectAuth);
  initializer.registerBeforeAuthenticateEmail(denyDirectAuth);
  logger.info('OneEngine ticket sign-in loaded (direct auth %s)', ctx.env['ALLOW_DIRECT_AUTH'] === 'true' ? 'ALLOWED' : 'blocked');
}
