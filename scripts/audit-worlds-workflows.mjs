/*
 * Project: Unfathomably FE
 * ------------------------
 *
 * File: audit-worlds-workflows.mjs
 *
 * Purpose:
 *   Exercise every authenticated Worlds user story in a real browser.
 *
 * Responsibilities:
 *   - establish an operator-supplied OAuth session without printing its token
 *   - open every family feed, finder, and creation workflow
 *   - prove plain-language controls exist without mutating remote state
 *   - fail on frontend exceptions, warnings, and request failures
 *
 * This file intentionally does not:
 *   - submit forms or create production objects
 *   - infer OAuth permissions beyond operator-supplied scopes
 *   - contact third-party discovery services directly
 */

import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

const site = new URL(process.env.UNFATHOMABLY_AUDIT_URL || 'https://social.fbxl.net');
const token = process.env.UNFATHOMABLY_AUDIT_TOKEN;
const scopes = process.env.UNFATHOMABLY_AUDIT_SCOPES || 'read write follow push';
const settleMs = Number.parseInt(process.env.UNFATHOMABLY_AUDIT_SETTLE_MS || '700', 10);

const worlds = [
  { family: 'books', heading: 'Find books and share reading', find: 'Find a book or edition' },
  { family: 'culture', heading: 'Explore film, music, games, and culture', find: 'Find a film, album, game, or other work' },
  { family: 'games', heading: 'Follow games and challenges', find: 'Find a player or game' },
  { family: 'models', heading: 'Find 3D models', find: 'Find a 3D model' },
  { family: 'marketplace', heading: 'Browse classifieds', find: 'Find an offer or request' },
  { family: 'routes', heading: 'Explore routes and trails', find: 'Find a route or trail' },
  { family: 'development', heading: 'Follow software projects', find: 'Find a project or issue' },
  { family: 'coordination', heading: 'Offer help and coordinate needs', find: 'Find help, offers, or needs' },
  { family: 'events', heading: 'Find events and gatherings', find: 'Find an event' },
  { family: 'audio', heading: 'Listen to audio', find: 'Find music or a podcast' },
  { family: 'video', heading: 'Watch video and live streams', find: 'Find a video or channel' },
  { family: 'photo', heading: 'Explore photography', find: 'Find photographs or photographers' },
  { family: 'longform', heading: 'Read articles and blogs', find: 'Find an article or writer' },
  { family: 'publishing', heading: 'Read publications and knowledge', find: 'Find a publication or document' },
  { family: 'groups', heading: 'Join communities and forums', find: 'Find a community' },
  { family: 'bookmarks', heading: 'Discover useful links', find: 'Find a saved link' },
];
const requestedFamilies = new Set(
  (process.env.UNFATHOMABLY_AUDIT_FAMILIES || '')
    .split(',')
    .map(family => family.trim())
    .filter(Boolean),
);
const auditedWorlds = requestedFamilies.size > 0
  ? worlds.filter(world => requestedFamilies.has(world.family))
  : worlds;

const sleep = (duration) => new Promise(resolve => setTimeout(resolve, duration));

const findBrowser = () => {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
  ].filter(Boolean);

  const browser = candidates.find(candidate => existsSync(candidate));

  if (!browser) {
    throw new Error('No Chromium browser was found. Set CHROME_PATH to its executable.');
  }

  return browser;
};

const reservePort = () => new Promise((resolve, reject) => {
  const server = createServer();
  server.unref();
  server.on('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : undefined;

    server.close(error => {
      if (error) reject(error);
      else if (port) resolve(port);
      else reject(new Error('Could not reserve a browser debugging port.'));
    });
  });
});

const waitForDebugger = async(port) => {
  const deadline = Date.now() + 15000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (response.ok) return response.json();
    } catch (_error) {
      // Chromium has not opened its debugging listener yet.
    }

    await sleep(100);
  }

  throw new Error('Chromium did not expose its debugging endpoint in time.');
};

const connectDevtools = async(webSocketUrl) => {
  const socket = new WebSocket(webSocketUrl);
  const listeners = new Map();
  const pending = new Map();
  let requestId = 0;

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id) {
      for (const listener of listeners.get(message.method) || []) listener(message.params || {});
      return;
    }
    if (!pending.has(message.id)) return;

    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);

    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++requestId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

  const on = (method, listener) => {
    const methodListeners = listeners.get(method) || [];
    methodListeners.push(listener);
    listeners.set(method, methodListeners);
  };

  return { send, on, close: () => socket.close() };
};

const evaluate = async(devtools, expression) => {
  const result = await devtools.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Browser evaluation failed.');
  }

  return result.result && result.result.value;
};

const navigate = async(devtools, url) => {
  await devtools.send('Page.navigate', { url });
  const deadline = Date.now() + 20000;

  while (Date.now() < deadline) {
    const ready = await evaluate(devtools, 'document.readyState');
    if (ready === 'complete') break;
    await sleep(100);
  }

  await sleep(settleMs);
};

const establishSession = async(devtools) => {
  const response = await fetch(new URL('/api/v1/accounts/verify_credentials', site), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Token verification failed with HTTP ${response.status}.`);
  }

  const account = await response.json();
  const authToken = {
    access_token: token,
    token_type: 'Bearer',
    scope: scopes,
    created_at: Math.floor(Date.now() / 1000),
    me: account.url,
  };
  const auth = {
    tokens: { [token]: authToken },
    users: { [account.url]: { id: String(account.id), url: account.url, access_token: token } },
    me: account.url,
  };
  const expression = [
    `localStorage.setItem('soapbox:auth', ${JSON.stringify(JSON.stringify(auth))})`,
    `sessionStorage.setItem('soapbox:auth:me', ${JSON.stringify(account.url)})`,
  ].join(';');

  await evaluate(devtools, expression);
};

const waitForViewReady = async(devtools, family, view) => {
  const deadline = Date.now() + Math.max(10000, settleMs);
  const expectedWorld = worlds.find(world => world.family === family);
  const expectedHeading = expectedWorld ? expectedWorld.heading : '';
  let condition;

  if (view === 'search') {
    condition = `(() => {
      const element = document.querySelector('#worlds-primary-search');
      if (!element) return false;
      const rectangle = element.getBoundingClientRect();
      return rectangle.width > 0 && rectangle.height > 0;
    })()`;
  } else if (view === 'create') {
    condition = `(() => {
      const root = document.querySelector('#worlds-create');
      return Boolean(root && root.querySelector('input, textarea, select, button'));
    })()`;
  } else {
    condition = `(document.querySelector('main') || document.body).innerText.includes(${JSON.stringify(expectedHeading)})`;
  }

  while (Date.now() < deadline) {
    if (await evaluate(devtools, condition)) return;
    await sleep(100);
  }
};

const inspectView = async(devtools, family, view) => {
  const path = `/worlds/${family}?view=${view}${view === 'create' ? '#worlds-create' : ''}`;
  await navigate(devtools, new URL(path, site).href);
  await waitForViewReady(devtools, family, view);

  return evaluate(devtools, `(() => {
    const root = document.querySelector('#worlds-create') || document.querySelector('main') || document.body;
    const isVisible = element => {
      const style = getComputedStyle(element);
      const rectangle = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rectangle.width > 0 && rectangle.height > 0;
    };
    const controlName = element => {
      const id = element.getAttribute('id');
      const explicitLabel = id ? document.querySelector('label[for="' + CSS.escape(id) + '"]') : null;
      const containingLabel = element.closest('label');
      return (
        element.getAttribute('aria-label') ||
        (explicitLabel && explicitLabel.innerText) ||
        (containingLabel && containingLabel.innerText) ||
        element.getAttribute('placeholder') ||
        element.innerText ||
        element.getAttribute('name') ||
        element.getAttribute('type') ||
        element.tagName
      ).replace(/\\s+/g, ' ').trim();
    };
    const controls = [...root.querySelectorAll('input, textarea, select, button')]
      .filter(isVisible)
      .map(element => ({
        tag: element.tagName.toLowerCase(),
        type: element.getAttribute('type') || undefined,
        name: element.getAttribute('name') || undefined,
        label: controlName(element).slice(0, 240),
        required: element.required || undefined,
      }));

    return {
      pathname: location.pathname,
      title: document.title,
      text: root.innerText.replace(/\\s+/g, ' ').trim().slice(0, 12000),
      controls,
      localItemLinks: [...root.querySelectorAll('a[href*="/notice/"]')].filter(isVisible).length,
      primarySearchVisible: Boolean(document.querySelector('#worlds-primary-search') && isVisible(document.querySelector('#worlds-primary-search'))),
      visibleError: /communication error|internal server error|native_query|something went wrong/i.test(root.innerText),
    };
  })()`);
};

const main = async() => {
  if (!token) throw new Error('UNFATHOMABLY_AUDIT_TOKEN is required.');
  if (!Number.isFinite(settleMs) || settleMs < 100 || settleMs > 30000) {
    throw new Error('UNFATHOMABLY_AUDIT_SETTLE_MS must be between 100 and 30000.');
  }

  const browserPath = findBrowser();
  const port = await reservePort();
  const profile = mkdtempSync(join(tmpdir(), 'unfathomably-worlds-audit-'));
  const browser = spawn(browserPath, [
    '--headless=new',
    '--disable-extensions',
    '--disable-background-networking',
    '--no-first-run',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ], { stdio: 'ignore' });

  let devtools;

  try {
    const targets = await waitForDebugger(port);
    const page = targets.find(target => target.type === 'page');
    if (!page || !page.webSocketDebuggerUrl) throw new Error('Chromium did not create an inspectable page.');

    devtools = await connectDevtools(page.webSocketDebuggerUrl);
    await devtools.send('Page.enable');
    await devtools.send('Runtime.enable');
    await devtools.send('Network.enable');
    const signals = [];
    const requestUrls = new Map();
    let activePath = '/';
    const addSignal = (kind, detail) => signals.push({ kind, path: activePath, detail: String(detail).slice(0, 1000) });

    devtools.on('Runtime.exceptionThrown', ({ exceptionDetails }) => {
      const exception = exceptionDetails && exceptionDetails.exception;
      addSignal('exception', (exception && exception.description) || (exceptionDetails && exceptionDetails.text) || 'Uncaught browser exception');
    });
    devtools.on('Runtime.consoleAPICalled', ({ type, args = [] }) => {
      if (type !== 'error' && type !== 'warning') return;
      addSignal(`console-${type}`, args.map(argument => argument.value || argument.description || '').join(' '));
    });
    devtools.on('Network.responseReceived', ({ response }) => {
      if (!response || response.status < 400) return;
      const responseUrl = new URL(response.url);
      if (responseUrl.origin === site.origin) addSignal(`http-${response.status}`, response.url);
    });
    devtools.on('Network.requestWillBeSent', ({ requestId, request }) => {
      if (requestId && request && request.url) requestUrls.set(requestId, request.url);
    });
    devtools.on('Network.loadingFinished', ({ requestId }) => requestUrls.delete(requestId));
    devtools.on('Network.loadingFailed', ({ blockedReason, canceled, corsErrorStatus, errorText, requestId, type }) => {
      const requestUrl = requestUrls.get(requestId) || 'unknown URL';
      requestUrls.delete(requestId);
      if (!canceled && errorText !== 'net::ERR_ABORTED') {
        const reason = errorText || blockedReason || (corsErrorStatus && corsErrorStatus.corsError) || 'unknown network error';
        addSignal('network-failed', `${type || 'resource'} ${reason}: ${requestUrl}`);
      }
    });
    devtools.on('Network.webSocketFrameError', ({ errorMessage }) => addSignal('websocket', errorMessage));
    await navigate(devtools, site.href);
    await establishSession(devtools);
    await navigate(devtools, site.href);

    const workflows = [];
    const failures = [];
    for (const world of auditedWorlds) {
      const views = {};
      for (const view of ['feed', 'search', 'create']) {
        activePath = `/worlds/${world.family}?view=${view}`;
        views[view] = await inspectView(devtools, world.family, view);
      }

      if (!views.feed.text.includes(world.heading)) failures.push({ family: world.family, view: 'feed', reason: `Missing heading: ${world.heading}` });
      if (views.feed.visibleError) failures.push({ family: world.family, view: 'feed', reason: 'Visible error message' });
      if (!views.search.primarySearchVisible) failures.push({ family: world.family, view: 'search', reason: 'Primary finder is not visible' });
      if (!views.search.text.includes(world.find)) failures.push({ family: world.family, view: 'search', reason: `Missing finder label: ${world.find}` });
      if (views.search.visibleError) failures.push({ family: world.family, view: 'search', reason: 'Visible error message' });
      if (views.create.controls.length === 0) failures.push({ family: world.family, view: 'create', reason: 'Creation or source-owned action has no visible controls' });
      if (views.create.visibleError) failures.push({ family: world.family, view: 'create', reason: 'Visible error message' });

      workflows.push({ family: world.family, views });
    }

    process.stdout.write(`${JSON.stringify({ site: site.href, workflows, failures, signals }, null, 2)}\n`);
    if (failures.length > 0 || signals.length > 0) process.exitCode = 1;
  } finally {
    try {
      if (devtools) await devtools.send('Browser.close');
    } catch (_error) {
      // The browser may already be closing after a navigation or protocol error.
    }

    if (devtools) devtools.close();
    const browserExited = new Promise(resolve => browser.once('exit', resolve));
    if (browser.exitCode === null) browser.kill();
    await Promise.race([browserExited, sleep(3000)]);

    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch (_error) {
      // Windows can briefly retain Chromium profile locks after Browser.close.
    }
  }
};

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exitCode = 1;
});

/* end of scripts/audit-worlds-workflows.mjs */
