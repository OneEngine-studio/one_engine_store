import { createRemoteJWKSet, jwtVerify, SignJWT } from 'jose';
import type { Config } from './config.js';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
}

const encoder = new TextEncoder();

/** Dev-only access token (HS256). Real deployments use the identity provider's tokens instead. */
export async function signDevToken(cfg: Config, user: AuthUser, ttlSeconds = 600): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(encoder.encode(cfg.devJwtSecret));
}

export type TokenVerifier = (token: string) => Promise<AuthUser>;

export function makeVerifier(cfg: Config): TokenVerifier {
  if (cfg.idpJwksUrl) {
    const jwks = createRemoteJWKSet(new URL(cfg.idpJwksUrl));
    return async (token) => {
      const { payload } = await jwtVerify(token, jwks, { issuer: cfg.idpIssuer, audience: cfg.idpAudience });
      if (!payload.sub) throw new Error('token has no subject');
      return {
        sub: payload.sub,
        email: String(payload.email ?? ''),
        name: String(payload.name ?? payload.preferred_username ?? 'Player'),
      };
    };
  }
  if (!cfg.allowDevLogin) {
    return async () => {
      throw new Error('no token verifier configured');
    };
  }
  const secret = encoder.encode(cfg.devJwtSecret);
  return async (token) => {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    if (!payload.sub) throw new Error('token has no subject');
    return { sub: payload.sub, email: String(payload.email ?? ''), name: String(payload.name ?? 'Player') };
  };
}
