// Checks shared by every IPC handler and by the window setup in main.cjs.
const { app } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

const DEV_ORIGIN = 'http://localhost:1420';

const appIndexUrl = () => pathToFileURL(path.join(__dirname, '../dist/index.html')).href;

/** True for the app's own page: the bundled index.html, or the dev server while developing. */
function isAppUrl(url) {
  if (typeof url !== 'string') return false;
  if (app.isPackaged) return url === appIndexUrl() || url.startsWith(`${appIndexUrl()}#`);
  return url.startsWith(DEV_ORIGIN) || url.startsWith(appIndexUrl());
}

/** IPC calls are accepted only from the main frame of the app's own page. */
function isTrustedSender(event) {
  const frame = event && event.senderFrame;
  return !!frame && frame.parent === null && isAppUrl(frame.url);
}

module.exports = { isAppUrl, isTrustedSender, DEV_ORIGIN };
