// Which Platform API addresses an installation may use. No electron imports, so build scripts can share it.
const isLocalHost = (host) => /^(localhost|127\.\d+\.\d+\.\d+|\[?::1\]?|0\.0\.0\.0)$/i.test(host);

/** Returns an origin (plus optional path) for an acceptable address, or '' when it is not acceptable. */
function cleanUrl(value, { allowLocal = false } = {}) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim());
    if (url.username || url.password) return '';
    const local = isLocalHost(url.hostname);
    if (local && !allowLocal) return '';
    if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) return '';
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  } catch {
    return '';
  }
}

module.exports = { cleanUrl, isLocalHost };
