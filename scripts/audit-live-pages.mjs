/*
 * Project: Unfathomably FE
 *
 * File: scripts/audit-live-pages.mjs
 *
 * Purpose:
 *
 *   Exercise the deployed frontend through a real Chromium browser and report
 *   route-level JavaScript, console, and same-origin HTTP failures.
 *
 * Responsibilities:
 *
 *   - launch an isolated browser profile
 *   - optionally establish an authenticated FE session from an environment token
 *   - visit concrete application routes and representative dynamic resources
 *   - return machine-readable audit evidence without exposing credentials
 *
 * This file intentionally does not contain credentials, mutate remote data, or
 * perform browser actions beyond navigation and read-only API discovery.
 */

import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';

const site = new URL(process.env.UNFATHOMABLY_AUDIT_URL || 'https://social.fbxl.net');
const token = process.env.UNFATHOMABLY_AUDIT_TOKEN;
const auditScopes = process.env.UNFATHOMABLY_AUDIT_SCOPES || 'read write follow push';
const accountHandle = process.env.UNFATHOMABLY_AUDIT_ACCOUNT || 'sj_zero';
const settleMs = Number.parseInt(process.env.UNFATHOMABLY_AUDIT_SETTLE_MS || '900', 10);
const requestSettleMs = Number.parseInt(
  process.env.UNFATHOMABLY_AUDIT_REQUEST_SETTLE_MS || '5000',
  10,
);
const requestQuietMs = Number.parseInt(
  process.env.UNFATHOMABLY_AUDIT_REQUEST_QUIET_MS || '250',
  10,
);
// Chrome may report the service-worker alias after its network request completes.
const serviceWorkerAliasWindowMs = 1000;
const streamingSettleMs = Number.parseInt(process.env.UNFATHOMABLY_AUDIT_STREAM_SETTLE_MS || '3000', 10);
const includeMedia = ['1', 'true', 'yes'].includes(
  (process.env.UNFATHOMABLY_AUDIT_INCLUDE_MEDIA || '').trim().toLowerCase(),
);
const requireStreaming = ['1', 'true', 'yes'].includes(
  (process.env.UNFATHOMABLY_AUDIT_REQUIRE_STREAMING || '').trim().toLowerCase(),
);
const expectedText = process.env.UNFATHOMABLY_AUDIT_EXPECT_TEXT || '';
const requestedRoutes = (process.env.UNFATHOMABLY_AUDIT_ROUTES || '')
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean);

const publicRoutes = [
  '/', '/timeline/local', '/timeline/global', '/timeline/fediverse', '/worlds', '/federation',
  ...[
    'books', 'culture', 'games', 'models', 'marketplace', 'routes', 'development',
    'coordination', 'events', 'audio', 'video', 'photo', 'longform', 'publishing',
    'groups', 'bookmarks',
  ].map((family) => `/worlds/${family}`),
  '/explore', '/suggestions/local', '/suggestions', '/directory', '/groups',
  '/groups/discover', '/feeds', '/sources', '/info', '/federation_restrictions',
  '/about', '/login/nostr', '/login/external', '/login/add', '/login', '/reset-password',
];

const authenticatedRoutes = [
  '/conversations', '/messages', '/lists', '/bookmarks', '/catchup', '/notifications',
  '/events', '/chats', '/chats/new', '/chats/settings', '/follow_requests', '/blocks',
  '/domain_blocks', '/mutes', '/filters', '/followed_tags', '/groups/my', '/groups/feed',
  '/groups/popular', '/groups/suggested', '/groups/tags', '/groups/pending-requests',
  '/feeds/my', '/feeds/feed', '/sources/my', '/sources/feed', '/statuses/new',
  '/scheduled_statuses', '/settings', '/settings/profile', '/settings/identity',
  '/settings/export', '/settings/import', '/settings/aliases', '/settings/migration',
  '/settings/backups', '/settings/relays', '/settings/email', '/settings/password',
  '/settings/account', '/settings/mfa', '/settings/tokens', '/soapbox/config',
  '/soapbox/admin', '/soapbox/admin/approval', '/soapbox/admin/federation-connectors',
  '/soapbox/admin/fasps', '/soapbox/admin/reports', '/soapbox/admin/log',
  '/soapbox/admin/invites', '/soapbox/admin/database-cleanup',
  '/soapbox/admin/federation-health', '/soapbox/admin/users', '/soapbox/admin/theme',
  '/soapbox/admin/relays', '/soapbox/admin/nostr/relays',
  '/soapbox/admin/announcements', '/soapbox/admin/domains', '/soapbox/admin/rules',
  '/developers', '/developers/apps/create', '/developers/settings_store',
  '/developers/timeline', '/developers/sw', '/share',
];

const streamingRoutePatterns = [
  /^\/$/,
  /^\/timeline\//,
  /^\/notifications$/,
  /^\/conversations$/,
  /^\/messages$/,
  /^\/chats(?:\/|$)/,
  /^\/groups\/(?:feed|my|popular|suggested|pending-requests)$/,
  /^\/feeds\/feed$/,
  /^\/sources\/feed$/,
];

const routeExpectsStreaming = (path) => token && requireStreaming && streamingRoutePatterns.some((pattern) =>
  pattern.test(path.split('?')[0]),
);

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const findBrowser = () => {
  const candidates = [
    process.env.BROWSER_BIN,
    'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'brave-browser', 'chromium', 'chromium-browser', 'google-chrome',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate.includes('\\') && existsSync(candidate)) return candidate;
    const probe = spawnSync(candidate, ['--version'], { stdio: 'ignore' });
    if (!probe.error && probe.status === 0) return candidate;
  }

  throw new Error('No Chromium browser found. Set BROWSER_BIN to its executable.');
};

const reservePort = () => new Promise((resolve, reject) => {
  const server = createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : undefined;
    server.close((error) => {
      if (error) reject(error);
      else if (port) resolve(port);
      else reject(new Error('Could not reserve a browser debugging port.'));
    });
  });
});

class DevToolsSession {

  constructor(socketUrl) {
    this.socket = new WebSocket(socketUrl);
    this.sequence = 0;
    this.pending = new Map();
    this.waiters = new Map();
    this.listeners = new Set();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
    });
    this.socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      const waiters = this.waiters.get(message.method) || [];
      this.waiters.set(message.method, []);
      waiters.forEach((resolve) => resolve(message.params));
      this.listeners.forEach((listener) => listener(message));
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.sequence;
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  waitFor(method, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const waiters = this.waiters.get(method) || [];
      const done = (params) => {
        clearTimeout(timer);
        resolve(params);
      };
      waiters.push(done);
      this.waiters.set(method, waiters);
      const timer = setTimeout(() => {
        const current = this.waiters.get(method) || [];
        this.waiters.set(method, current.filter((waiter) => waiter !== done));
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeout);
    });
  }

  close() {
    this.socket.close();
  }

}

const requestJson = async(path) => {
  const headers = token ? { authorization: `Bearer ${token}` } : {};
  const response = await fetch(new URL(path, site), { headers });
  if (!response.ok) return undefined;
  return response.json();
};

const establishSession = async(devtools, account) => {
  if (!token || !account || !account.url || !account.id) return;
  const authToken = {
    access_token: token,
    token_type: 'Bearer',
    scope: auditScopes,
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
  await devtools.send('Runtime.evaluate', { expression });
};

const main = async() => {
  if (!Number.isFinite(settleMs) || settleMs < 100 || settleMs > 30000) {
    throw new Error('UNFATHOMABLY_AUDIT_SETTLE_MS must be between 100 and 30000.');
  }
  if (!Number.isFinite(requestSettleMs) || requestSettleMs < 100 || requestSettleMs > 30000) {
    throw new Error('UNFATHOMABLY_AUDIT_REQUEST_SETTLE_MS must be between 100 and 30000.');
  }
  if (!Number.isFinite(requestQuietMs) || requestQuietMs < 50 || requestQuietMs > 5000) {
    throw new Error('UNFATHOMABLY_AUDIT_REQUEST_QUIET_MS must be between 50 and 5000.');
  }

  const browser = findBrowser();
  const port = await reservePort();
  const profile = mkdtempSync(join(tmpdir(), 'unfathomably-page-audit-'));
  const browserProcess = spawn(browser, [
    '--headless=new', '--disable-gpu', '--disable-extensions', '--disable-background-networking',
    '--disable-default-apps', '--disable-sync', '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: 'ignore' });

  let devtools;
  let target;

  try {
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/json/version`);
        ready = response.ok;
        if (ready) break;
      } catch (_error) {
        // Chromium opens the debugging endpoint asynchronously.
      }
      await sleep(200);
    }
    if (!ready) throw new Error('Chromium did not open its debugging endpoint.');

    target = await fetch(
      `http://127.0.0.1:${port}/json/new?${encodeURIComponent(new URL('/login', site))}`,
      { method: 'PUT' },
    ).then((response) => response.json());
    devtools = new DevToolsSession(target.webSocketDebuggerUrl);
    await devtools.open();
    await Promise.all([
      devtools.send('Page.enable'), devtools.send('Runtime.enable'),
      devtools.send('Network.enable'), devtools.send('Log.enable'),
    ]);
    if (!includeMedia) {
      await devtools.send('Network.setBlockedURLs', { urls: [`${site.origin}/proxy/*`] });
    }
    await devtools.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `(() => {
        const responseJson = Response.prototype.json;
        Response.prototype.json = async function auditResponseJson() {
          try {
            return await responseJson.call(this);
          } catch (error) {
            console.error(
              'Response JSON parse failed',
              this.url,
              this.status,
              this.headers.get('content-type') || 'unknown-content-type',
            );
            throw error;
          }
        };

        const jsonParse = JSON.parse;
        JSON.parse = function auditJsonParse(value, reviver) {
          try {
            return jsonParse.call(this, value, reviver);
          } catch (error) {
            const text = typeof value === 'string' ? value : '';
            console.error(
              'JSON.parse failed',
              'length=' + text.length,
              'first=' + (text.charAt(0) || 'empty'),
              error.stack || error.message,
            );
            throw error;
          }
        };
      })();`,
    });

    let currentRoute;
    let routeEvents = [];
    let routeRequests = new Map();
    let routeCompletedUrls = new Map();
    let routeWebSockets = new Map();
    const requestUrls = new Map();

    const finishRouteRequest = (requestId, url) => {
      routeRequests.delete(requestId);
      if (!url) return;
      routeCompletedUrls.set(url, Date.now());

      for (const [aliasId, requestUrl] of routeRequests.entries()) {
        if (requestUrl === url) routeRequests.delete(aliasId);
      }
    };

    devtools.listeners.add(({ method, params }) => {
      if (method === 'Network.requestWillBeSent') {
        requestUrls.set(params.requestId, params.request.url);
        if (
          currentRoute &&
          ['Fetch', 'XHR'].includes(params.type) &&
          params.request.url.startsWith(site.origin) &&
          new URL(params.request.url).pathname.startsWith('/api/')
        ) {
          const completedAt = routeCompletedUrls.get(params.request.url);
          if (!completedAt || Date.now() - completedAt > serviceWorkerAliasWindowMs) {
            routeRequests.set(params.requestId, params.request.url);
          }
        }
      } else if (method === 'Network.loadingFinished' || method === 'Network.loadingFailed') {
        finishRouteRequest(params.requestId, requestUrls.get(params.requestId));
      } else if (method === 'Network.requestServedFromCache') {
        finishRouteRequest(params.requestId, requestUrls.get(params.requestId));
      }
      if (!currentRoute) return;
      if (method === 'Runtime.exceptionThrown') {
        const details = params.exceptionDetails || {};
        const exception = details.exception || {};
        const frames = (details.stackTrace?.callFrames || [])
          .slice(0, 4)
          .map(({ functionName, url, lineNumber, columnNumber }) =>
            `${functionName || '<anonymous>'} at ${url}:${lineNumber + 1}:${columnNumber + 1}`)
          .join(' <- ');
        const description = exception.description || details.text;
        routeEvents.push({
          kind: 'exception',
          text: frames ? `${description} | ${frames}` : description,
        });
      } else if (method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(params.type)) {
        routeEvents.push({
          kind: `console-${params.type}`,
          text: (params.args || []).map((arg) => {
            if (arg.value !== undefined) return arg.value;
            if (arg.description !== undefined) return arg.description;
            return '';
          }).join(' '),
        });
      } else if (method === 'Log.entryAdded' && params.entry && ['error', 'warning'].includes(params.entry.level)) {
        routeEvents.push({ kind: `log-${params.entry.level}`, text: params.entry.text });
      } else if (method === 'Network.responseReceived') {
        const response = params.response;
        finishRouteRequest(params.requestId, response.url);
        if (response.url.startsWith(site.origin) && response.status >= 400) {
          routeEvents.push({ kind: `http-${response.status}`, text: response.url });
        }
      } else if (method === 'Network.loadingFailed') {
        const url = requestUrls.get(params.requestId);
        const auditMediaBlock = !includeMedia && params.blockedReason === 'inspector' && url && url.startsWith(`${site.origin}/proxy/`);
        if (url && url.startsWith(site.origin) && params.errorText !== 'net::ERR_ABORTED' && !auditMediaBlock) {
          routeEvents.push({ kind: 'network-failed', text: `${params.errorText}: ${url}` });
        }
      } else if (method === 'Network.webSocketCreated') {
        routeWebSockets.set(params.requestId, {
          url: params.url,
          status: undefined,
          framesReceived: 0,
          expectedTextFrameReceived: false,
        });
      } else if (method === 'Network.webSocketHandshakeResponseReceived') {
        const socket = routeWebSockets.get(params.requestId);
        if (socket) socket.status = params.response.status;
      } else if (method === 'Network.webSocketFrameReceived') {
        const socket = routeWebSockets.get(params.requestId);
        if (socket) {
          socket.framesReceived += 1;
          socket.expectedTextFrameReceived ||= Boolean(
            expectedText && params.response.payloadData.includes(expectedText),
          );
        }
      } else if (method === 'Network.webSocketFrameError') {
        routeEvents.push({ kind: 'websocket-error', text: params.errorMessage });
      }
    });

    const navigate = async(path) => {
      currentRoute = path;
      routeEvents = [];
      routeRequests = new Map();
      routeCompletedUrls = new Map();
      routeWebSockets = new Map();
      const loaded = devtools.waitFor('Page.loadEventFired');
      const navigation = await devtools.send('Page.navigate', { url: new URL(path, site).href });
      let loadTimedOut = false;
      if (navigation.errorText) routeEvents.push({ kind: 'navigation', text: navigation.errorText });
      try {
        await loaded;
      } catch (_error) {
        loadTimedOut = true;
      }
      const inspectPage = async() => {
        const inspected = await devtools.send('Runtime.evaluate', {
          expression: `(() => {
            const text = (document.body?.innerText || '').replace(/\\s+/g, ' ').trim();
            return {
              pathname: location.pathname,
              title: document.title,
              textLength: text.length,
              sample: text.slice(0, 240),
              expectedTextVisible: !${JSON.stringify(expectedText)} || text.includes(${JSON.stringify(expectedText)}),
              visibleError: /something went wrong|communication error|invalid value for enum|native_query|internal server error/i.test(text),
            };
          })()`,
          returnByValue: true,
        });
        return inspected.result && inspected.result.value ? inspected.result.value : {};
      };
      const waitForRouteRequests = async() => {
        const deadline = Date.now() + requestSettleMs;
        let quietSince = routeRequests.size === 0 ? Date.now() : undefined;

        while (Date.now() < deadline) {
          if (routeRequests.size > 0) {
            quietSince = undefined;
          } else if (quietSince === undefined) {
            quietSince = Date.now();
          } else if (Date.now() - quietSince >= requestQuietMs) {
            return;
          }

          await sleep(50);
        }

        if (routeRequests.size > 0) {
          routeEvents.push({
            kind: 'request-settle-timeout',
            text: [...new Set(routeRequests.values())].slice(0, 10).join(', '),
          });
        }
      };

      await sleep(settleMs);
      let page = await inspectPage();
      const expectsStreaming = routeExpectsStreaming(path);
      if (expectsStreaming && ![...routeWebSockets.values()].some(({ status }) => status === 101)) {
        await sleep(streamingSettleMs);
        page = await inspectPage();
      }
      for (let attempt = 0; page.textLength < 20 && attempt < 10; attempt += 1) {
        await sleep(500);
        page = await inspectPage();
      }
      await waitForRouteRequests();
      page = await inspectPage();
      const webSockets = [...routeWebSockets.values()];
      if (expectsStreaming && !webSockets.some(({ status }) => status === 101)) {
        routeEvents.push({ kind: 'streaming-missing', text: 'No authenticated WebSocket completed its handshake.' });
      }
      if (expectedText && !page.expectedTextVisible) {
        routeEvents.push({ kind: 'expected-text-missing', text: 'Expected live-page text did not appear.' });
      }
      const uniqueEvents = [];
      const seen = new Set();
      for (const event of routeEvents) {
        const rawText = String(event.text || '');
        const text = (token ? rawText.replaceAll(token, '[redacted]') : rawText).slice(0, 500);
        const key = `${event.kind}:${text}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueEvents.push({ ...event, text });
        }
      }
      const failed = loadTimedOut || page.visibleError || page.textLength < 20 || uniqueEvents.some(({ kind }) =>
        kind === 'exception' || kind === 'console-error' || kind === 'network-failed' ||
         kind === 'expected-text-missing' || kind === 'navigation' || kind === 'streaming-missing' ||
         kind === 'websocket-error' || kind === 'request-settle-timeout' ||
         kind.startsWith('http-5'),
      );
      currentRoute = undefined;
      return { requestedPath: path, loadTimedOut, failed, ...page, webSockets, events: uniqueEvents };
    };

    await navigate('/login');
    let ownAccount;
    if (token) {
      ownAccount = await requestJson('/api/v1/accounts/verify_credentials');
      if (!ownAccount) throw new Error('The supplied audit token could not verify an account.');
      await establishSession(devtools, ownAccount);
    }

    const account = ownAccount || await requestJson(`/api/v1/accounts/lookup?acct=${encodeURIComponent(accountHandle)}`);
    const routes = requestedRoutes.length > 0
      ? requestedRoutes
      : [...publicRoutes, ...authenticatedRoutes];
    if (requestedRoutes.length === 0 && account && account.acct) {
      const handle = account.acct;
      routes.push(`/@${handle}`, `/@${handle}/with_replies`, `/@${handle}/followers`, `/@${handle}/following`, `/@${handle}/media`);
      const statuses = await requestJson(`/api/v1/accounts/${encodeURIComponent(account.id)}/statuses?limit=1`);
      if (Array.isArray(statuses) && statuses[0] && statuses[0].id) {
        routes.push(`/posts/${statuses[0].id}`, `/@${handle}/posts/${statuses[0].id}`, `/@${handle}/posts/${statuses[0].id}/quotes`);
      }
    }
    if (requestedRoutes.length === 0 && token) {
      const lists = await requestJson('/api/v1/lists');
      if (Array.isArray(lists) && lists[0] && lists[0].id) routes.push(`/list/${lists[0].id}`);
      const chats = await requestJson('/api/v1/pleroma/chats?limit=1');
      if (Array.isArray(chats) && chats[0] && chats[0].id) routes.push(`/chats/${chats[0].id}`);
    }

    const results = [];
    for (const route of [...new Set(routes)]) results.push(await navigate(route));
    const report = {
      site: site.origin,
      authenticated: Boolean(token),
      includeMedia,
      requireStreaming,
      expectedTextRequired: Boolean(expectedText),
      account: account && account.acct,
      auditedRoutes: results.length,
      failures: results.filter(({ failed }) => failed),
      signals: results.filter(({ failed, events }) => !failed && events.length > 0),
      streaming: results.map(({ requestedPath, webSockets }) => ({ requestedPath, webSockets })),
      emptyPages: results.filter(({ failed, pathname, textLength }) => !failed && pathname !== '/login' && textLength < 20),
    };
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (report.failures.length > 0) process.exitCode = 1;
  } finally {
    if (devtools) devtools.close();
    if (target && target.id) await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(() => undefined);
    if (process.platform === 'win32' && browserProcess.pid) {
      spawnSync('taskkill', ['/pid', String(browserProcess.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      browserProcess.kill();
    }
    await sleep(500);
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 30, retryDelay: 500 });
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
      if (!['EPERM', 'EBUSY'].includes(code)) {
        console.error(error);
        process.exitCode = 1;
      }
    }
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/* end of scripts/audit-live-pages.mjs */
