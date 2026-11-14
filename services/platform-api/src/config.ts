export interface Config {
  port: number;
  production: boolean;
  dbPath: string;
  allowDevLogin: boolean;
  /** Signs access tokens and email codes. Random 32+ characters in production. */
  jwtSecret: string;
  idpJwksUrl: string;
  idpIssuer: string;
  idpAudience: string;
  serviceKey: string;
  downloadKey: string;
  depotDir: string;
  publicBaseUrl: string;
  smtpUrl: string;
  mailFrom: string;
  /** Players must confirm their email before they can get a game, download it or start it. */
  requireVerifiedEmail: boolean;
  /** scrypt cost (N). Lower only in tests. */
  passwordCost: number;
  corsOrigins: string[];
  logLevel: string;
}

export const DEV_DEFAULTS = {
  jwtSecret: 'dev-only-change-me-dev-only-change-me',
  serviceKey: 'dev-service-key-change-me',
  downloadKey: 'dev-download-key-change-me',
};

export const MIN_PASSWORD_COST = 2 ** 15;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const production = env.NODE_ENV === 'production';
  const allowDevLogin = env.ALLOW_DEV_LOGIN === 'true';

  const cfg: Config = {
    port: Number(env.PORT ?? 8080),
    production,
    dbPath: env.DB_PATH ?? './data/platform.db',
    allowDevLogin,
    jwtSecret: env.JWT_SECRET ?? env.DEV_JWT_SECRET ?? DEV_DEFAULTS.jwtSecret,
    idpJwksUrl: env.IDP_JWKS_URL ?? '',
    idpIssuer: env.IDP_ISSUER ?? '',
    idpAudience: env.IDP_AUDIENCE ?? 'oneengine-platform',
    serviceKey: env.PLATFORM_SERVICE_KEY ?? DEV_DEFAULTS.serviceKey,
    downloadKey: env.PLATFORM_DOWNLOAD_KEY ?? DEV_DEFAULTS.downloadKey,
    depotDir: env.DEPOT_DIR ?? './data/depot',
    publicBaseUrl: (env.PUBLIC_BASE_URL ?? '').replace(/\/+$/, ''),
    smtpUrl: env.SMTP_URL ?? '',
    mailFrom: env.MAIL_FROM ?? 'OneEngine <no-reply@localhost>',
    requireVerifiedEmail:
      env.REQUIRE_EMAIL_VERIFICATION === undefined ? production : env.REQUIRE_EMAIL_VERIFICATION === 'true',
    passwordCost: Number(env.PASSWORD_COST ?? 2 ** 16),
    logLevel: env.LOG_LEVEL ?? 'info',
    corsOrigins: (env.CORS_ORIGINS ?? 'http://localhost:1420').split(',').map((s) => s.trim()).filter(Boolean),
  };

  if (production) {
    const problems: string[] = [];
    if (allowDevLogin) problems.push('ALLOW_DEV_LOGIN must not be true in production');
    if (!cfg.idpJwksUrl && (cfg.jwtSecret === DEV_DEFAULTS.jwtSecret || cfg.jwtSecret.length < 32)) {
      problems.push('JWT_SECRET must be a random value of at least 32 characters');
    }
    if (cfg.serviceKey === DEV_DEFAULTS.serviceKey || cfg.serviceKey.length < 32) {
      problems.push('PLATFORM_SERVICE_KEY must be a random value of at least 32 characters');
    }
    if (cfg.downloadKey === DEV_DEFAULTS.downloadKey || cfg.downloadKey.length < 32) {
      problems.push('PLATFORM_DOWNLOAD_KEY must be a random value of at least 32 characters');
    }
    if (cfg.requireVerifiedEmail && !cfg.smtpUrl) {
      problems.push('SMTP_URL is required while email verification is on (or set REQUIRE_EMAIL_VERIFICATION=false)');
    }
    if (cfg.passwordCost < MIN_PASSWORD_COST) problems.push('PASSWORD_COST is too low for production');
    if (problems.length) throw new Error(`Unsafe production config:\n- ${problems.join('\n- ')}`);
  }
  return cfg;
}
