import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Config } from './config.js';

/** What a verified Google sign-in tells us about the person. */
export interface GoogleIdentity {
  subject: string;
  email: string;
  emailVerified: boolean;
  name: string;
}

export type GoogleExchange = (input: { code: string; codeVerifier: string; redirectUri: string; nonce: string }) => Promise<GoogleIdentity>;

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

export const googleConfigured = (cfg: Config) => !!cfg.googleClientId && !!cfg.googleClientSecret;

/**
 * Redeems the authorization code with Google and verifies the ID token it returns: signature against
 * Google's published keys, issuer, audience (our client id), expiry and the nonce the launcher chose.
 * The client secret never leaves this server.
 */
export function makeGoogleExchange(cfg: Config): GoogleExchange {
  const jwks = createRemoteJWKSet(new URL(JWKS_URL));
  return async ({ code, codeVerifier, redirectUri, nonce }) => {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: cfg.googleClientId,
        client_secret: cfg.googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Google refused the code (${res.status})`);
    const body = (await res.json()) as { id_token?: string };
    if (!body.id_token) throw new Error('Google sent no ID token');

    const { payload } = await jwtVerify(body.id_token, jwks, { issuer: ISSUERS, audience: cfg.googleClientId });
    if (payload.nonce !== nonce) throw new Error('Google sign-in nonce mismatch');
    if (!payload.sub || typeof payload.email !== 'string') throw new Error('Google sent no email');
    return {
      subject: payload.sub,
      email: payload.email.toLowerCase(),
      emailVerified: payload.email_verified === true,
      name: typeof payload.name === 'string' ? payload.name : '',
    };
  };
}
