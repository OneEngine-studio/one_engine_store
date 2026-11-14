import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

const KEY_LENGTH = 64;
const R = 8;
const P = 1;

const derive = (password: string, salt: Buffer, n: number) =>
  new Promise<Buffer>((resolve, reject) => {
    const options: ScryptOptions = { N: n, r: R, p: P, maxmem: 256 * 1024 * 1024 };
    scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, options, (err, key) => (err ? reject(err) : resolve(key)));
  });

/** "scrypt$N$r$p$salt$hash", all parameters stored so the cost can be raised later. */
export async function hashPassword(password: string, cost: number): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, cost);
  return `scrypt$${cost}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || Number(r) !== R || Number(p) !== P || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await derive(password, Buffer.from(salt, 'base64'), Number(n));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
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
