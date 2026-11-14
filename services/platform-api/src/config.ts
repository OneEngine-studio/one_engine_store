export interface Config {
  port: number;
  production: boolean;
  dbPath: string;
  allowDevLogin: boolean;
  devJwtSecret: string;
  idpJwksUrl: string;
  idpIssuer: string;
  idpAudience: string;
  serviceKey: string;
  downloadKey: string;
  depotDir: string;
  publicBaseUrl: string;
  corsOrigins: string[];
  logLevel: string;
}

const DEV_DEFAULTS = {
  devJwtSecret: 'dev-only-change-me-dev-only-change-me',
  serviceKey: 'dev-service-key-change-me',
  downloadKey: 'dev-download-key-change-me',
};

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const production = env.NODE_ENV === 'production';
  const allowDevLogin = env.ALLOW_DEV_LOGIN === 'true';

  const cfg: Config = {
    port: Number(env.PORT ?? 8080),
    production,
    dbPath: env.DB_PATH ?? './data/platform.db',
    allowDevLogin,
    devJwtSecret: env.DEV_JWT_SECRET ?? DEV_DEFAULTS.devJwtSecret,
    idpJwksUrl: env.IDP_JWKS_URL ?? '',
    idpIssuer: env.IDP_ISSUER ?? '',
    idpAudience: env.IDP_AUDIENCE ?? 'oneengine-platform',
    serviceKey: env.PLATFORM_SERVICE_KEY ?? DEV_DEFAULTS.serviceKey,
    downloadKey: env.PLATFORM_DOWNLOAD_KEY ?? DEV_DEFAULTS.downloadKey,
    depotDir: env.DEPOT_DIR ?? './data/depot',
    publicBaseUrl: (env.PUBLIC_BASE_URL ?? '').replace(/\/+$/, ''),
    logLevel: env.LOG_LEVEL ?? 'info',
    corsOrigins: (env.CORS_ORIGINS ?? 'http://localhost:1420').split(',').map((s) => s.trim()).filter(Boolean),
  };

  if (production) {
    const problems: string[] = [];
    if (allowDevLogin) problems.push('ALLOW_DEV_LOGIN must not be true in production');
    if (!cfg.idpJwksUrl || !cfg.idpIssuer) problems.push('IDP_JWKS_URL and IDP_ISSUER are required in production');
    if (cfg.serviceKey === DEV_DEFAULTS.serviceKey || cfg.serviceKey.length < 32) {
      problems.push('PLATFORM_SERVICE_KEY must be a random value of at least 32 characters');
    }
    if (cfg.downloadKey === DEV_DEFAULTS.downloadKey || cfg.downloadKey.length < 32) {
      problems.push('PLATFORM_DOWNLOAD_KEY must be a random value of at least 32 characters');
    }
    if (problems.length) throw new Error(`Unsafe production config:\n- ${problems.join('\n- ')}`);
  }
  return cfg;
}
