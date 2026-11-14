import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

// New passwords are hashed with Argon2id (the default algorithm of this binding). `cost` is the memory
// cost in KiB; the time and parallelism costs follow the OWASP guidance for Argon2id.
const TIME_COST = 3;
const PARALLELISM = 1;

export async function hashPassword(password: string, cost: number): Promise<string> {
  return argonHash(password.normalize('NFKC'), { memoryCost: cost, timeCost: TIME_COST, parallelism: PARALLELISM });
}

// ---- legacy scrypt hashes ("scrypt$N$r$p$salt$hash") ----
// Accounts created before the move to Argon2id still carry one. They keep working and are replaced by an
// Argon2id hash the next time that player signs in (see needsRehash).
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

const scryptDerive = (password: string, salt: Buffer, n: number) =>
  new Promise<Buffer>((resolve, reject) => {
    const options: ScryptOptions = { N: n, r: SCRYPT_R, p: SCRYPT_P, maxmem: 256 * 1024 * 1024 };
    scrypt(password.normalize('NFKC'), salt, SCRYPT_KEY_LENGTH, options, (err, key) => (err ? reject(err) : resolve(key)));
  });

async function verifyLegacyScrypt(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || Number(r) !== SCRYPT_R || Number(p) !== SCRYPT_P || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await scryptDerive(password, Buffer.from(salt, 'base64'), Number(n));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    if (stored.startsWith('$argon2id$')) return await argonVerify(stored, password.normalize('NFKC'));
    if (stored.startsWith('scrypt$')) return await verifyLegacyScrypt(password, stored);
  } catch {
    // a malformed stored hash counts as a wrong password
  }
  return false;
}

/** True when the stored hash is not Argon2id at the configured cost, so a successful login should replace it. */
export function needsRehash(stored: string, cost: number): boolean {
  const match = /^\$argon2id\$v=\d+\$m=(\d+),t=(\d+),p=(\d+)\$/.exec(stored);
  if (!match) return true;
  return Number(match[1]) < cost || Number(match[2]) < TIME_COST || Number(match[3]) !== PARALLELISM;
}

/** Only for building legacy hashes in tests. */
export async function legacyScryptHash(password: string, n = 1024): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptDerive(password, salt, n);
  return `scrypt$${n}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

const COMMON = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890', 'qwertyui', 'qwerty123',
  'iloveyou', 'letmein1', 'welcome1', 'admin1234', 'abc12345', '11111111', 'oneengine',
]);

/** Returns a message when the password is not acceptable, otherwise null. */
export function passwordProblem(password: string, email: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (password.length > 128) return 'Use at most 128 characters.';
  const lower = password.toLowerCase();
  if (COMMON.has(lower)) return 'That password is too common. Pick something less guessable.';
  if (lower === email.toLowerCase() || lower === email.split('@')[0]?.toLowerCase()) {
    return 'The password cannot be your email address.';
  }
  if (/^(.)\1+$/.test(password)) return 'The password cannot be one repeated character.';
  return null;
}
