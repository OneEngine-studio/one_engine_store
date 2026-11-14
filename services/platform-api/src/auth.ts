import { createRemoteJWKSet, jwtVerify, SignJWT } from 'jose';
import type { Config } from './config.js';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
}

const encoder = new TextEncoder();

/** Access token (HS256). Short lived; the refresh token keeps the player signed in. */
export async function signAccessToken(cfg: Config, user: AuthUser, ttlSeconds: number): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(encoder.encode(cfg.jwtSecret));
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
  const secret = encoder.encode(cfg.jwtSecret);
  return async (token) => {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    if (!payload.sub) throw new Error('token has no subject');
    return { sub: payload.sub, email: String(payload.email ?? ''), name: String(payload.name ?? 'Player') };
  };
}
