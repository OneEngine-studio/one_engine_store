// Publishing builds from the launcher, for accounts the Platform API lists as publishers.
// The desktop app's main process (electron/publisher.cjs) picks the file, holds the sign-in and streams the upload.

export interface PublishableProduct {
  productId: string;
  title: string;
  current: { buildId: string; version: string; sizeBytes: number; publishedAt: string } | null;
}

export interface PickedZip {
  name: string;
  size: number;
  files: number;
  executables: string[];
  hasDebugFolders: boolean;
}

export interface PublishResult {
  buildId: string;
  version: string;
  sizeBytes: number;
  sha256: string;
  removed: string[];
}

export class PublishError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
  }
}

const bridge = () => (typeof window !== 'undefined' ? window.electronAPI?.publisher : undefined);

const errorOf = (data: Record<string, unknown>, fallback: string) => {
  const e = data as { error?: { code?: string; message?: string } };
  return new PublishError(e.error?.message || fallback, e.error?.code || 'error');
};

export const publisherApi = {
  isAvailable: () => !!bridge(),

  /** Products this account may publish; empty for everyone else (and outside the desktop app). */
  async products(): Promise<PublishableProduct[]> {
    const b = bridge();
    if (!b) return [];
    const res = await b.products();
    if (res.status !== 200) return [];
    return ((res.data as { items?: PublishableProduct[] }).items ?? []) as PublishableProduct[];
  },

  async pickZip(): Promise<PickedZip | null> {
    const b = bridge();
    if (!b) throw new PublishError('Publishing works in the desktop app only.', 'unavailable');
    const res = await b.pickZip();
    if (!res.ok) {
      if (res.message) throw new PublishError(res.message, 'bad_zip');
      return null;
    }
    return {
      name: res.name ?? '',
      size: res.size ?? 0,
      files: res.files ?? 0,
      executables: res.executables ?? [],
      hasDebugFolders: !!res.hasDebugFolders,
    };
  },

  async upload(productId: string, version: string, executable: string): Promise<PublishResult> {
    const b = bridge();
    if (!b) throw new PublishError('Publishing works in the desktop app only.', 'unavailable');
    const res = await b.upload({ productId, version, executable });
    if (res.status === 201) return res.data as unknown as PublishResult;
    throw errorOf(res.data, 'The build could not be published.');
  },

  cancel: () => bridge()?.cancel(),
  onProgress: (cb: Parameters<NonNullable<ReturnType<typeof bridge>>['onProgress']>[0]) => bridge()?.onProgress(cb) ?? (() => {}),
};

export const formatBytes = (n: number) =>
  n >= 1024 ** 3 ? `${(n / 1024 ** 3).toFixed(2)} GB` : n >= 1024 ** 2 ? `${(n / 1024 ** 2).toFixed(0)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
