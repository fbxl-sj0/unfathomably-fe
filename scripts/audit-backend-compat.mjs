/*
 * Project: Unfathomably FE
 *
 * File: scripts/audit-backend-compat.mjs
 *
 * Purpose:
 *
 *   Exercise one Unfathomably FE build against several live Mastodon API
 *   backend implementations through isolated same-origin gateways.
 *
 * Responsibilities:
 *
 *   - serve the current production frontend build
 *   - proxy backend HTTP and WebSocket requests without storing credentials
 *   - identify each backend through NodeInfo and select a representative user
 *   - run the standard read-only Chromium page audit for every backend
 *   - emit a combined machine-readable compatibility report
 *
 * This file intentionally does not create accounts, authenticate users,
 * perform writes, or modify the remote backend instances.
 */

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { connect as connectTls } from 'node:tls';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const scriptRoot = resolve(fileURLToPath(new URL('.', import.meta.url)));
const projectRoot = resolve(scriptRoot, '..');
const staticRoot = resolve(projectRoot, 'dist');
const pageAudit = resolve(scriptRoot, 'audit-live-pages.mjs');
const indexFile = join(staticRoot, 'index.html');

const defaultTargets = [
  { name: 'mastodon', url: 'https://mastodon.social' },
  { name: 'pleroma', url: 'https://pleroma.soykaf.com' },
  { name: 'rebased', url: 'https://spinster.xyz' },
  { name: 'akkoma', url: 'https://ihatebeinga.live' },
];

const proxyPrefixes = [
  '/api/',
  '/oauth/',
  '/.well-known/',
  '/emoji/',
  '/instance/',
  '/media/',
  '/nodeinfo/',
  '/proxy/',
  '/static/',
  '/users/',
  '/manifest.json',
  '/relay',
  '/socket/',
];

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webmanifest', 'application/manifest+json'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

const readTargets = () => {
  const configured = process.env.UNFATHOMABLY_BACKEND_AUDIT_TARGETS;
  if (!configured) return defaultTargets;

  const targets = JSON.parse(configured);
  if (!Array.isArray(targets) || targets.length === 0) {
    throw new Error('UNFATHOMABLY_BACKEND_AUDIT_TARGETS must be a non-empty JSON array.');
  }

  return targets.map((target) => {
    if (!target || typeof target.name !== 'string' || typeof target.url !== 'string') {
      throw new Error('Each backend audit target requires string name and url fields.');
    }

    const url = new URL(target.url);
    if (url.protocol !== 'https:') {
      throw new Error('Backend audit targets must use HTTPS: ' + target.url);
    }

    return { name: target.name, url: url.origin };
  });
};

const shouldProxy = (pathname) =>
  proxyPrefixes.some((prefix) => pathname.startsWith(prefix));

const sendFile = (request, response, filename) => {
  const stat = statSync(filename);
  response.writeHead(200, {
    'cache-control': filename === indexFile ? 'no-store' : 'public, max-age=3600',
    'content-length': stat.size,
    'content-type': mimeTypes.get(extname(filename).toLowerCase()) || 'application/octet-stream',
  });

  if (request.method === 'HEAD') response.end();
  else createReadStream(filename).pipe(response);
};

const proxyHttp = async(request, response, upstream) => {
  const target = new URL(request.url, upstream);
  const headers = { ...request.headers };
  delete headers.host;
  delete headers.connection;
  delete headers['content-length'];
  delete headers['accept-encoding'];

  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);

  const remote = await fetch(target, {
    method: request.method,
    headers,
    body: chunks.length > 0 ? Buffer.concat(chunks) : undefined,
    redirect: 'manual',
    signal: AbortSignal.timeout(30_000),
  });

  const outgoingHeaders = {};
  remote.headers.forEach((value, name) => {
    if (!['connection', 'content-encoding', 'content-length', 'transfer-encoding'].includes(name)) {
      outgoingHeaders[name] = value;
    }
  });

  const payload = Buffer.from(await remote.arrayBuffer());
  outgoingHeaders['content-length'] = payload.length;
  response.writeHead(remote.status, outgoingHeaders);
  response.end(payload);
};

const createGateway = async(target) => {
  const upstream = new URL(target.url);
  const server = createServer(async(request, response) => {
    try {
      const localUrl = new URL(request.url, 'http://127.0.0.1');
      let relativePath;
      try {
        relativePath = decodeURIComponent(localUrl.pathname).replace(/^\/+/, '');
      } catch (_error) {
        response.writeHead(400).end();
        return;
      }

      const filename = resolve(staticRoot, normalize(relativePath || 'index.html'));
      const contained = filename === indexFile || filename.startsWith(staticRoot + sep);
      if (contained && existsSync(filename) && statSync(filename).isFile()) {
        sendFile(request, response, filename);
        return;
      }

      if (shouldProxy(localUrl.pathname)) {
        await proxyHttp(request, response, upstream);
        return;
      }

      if (extname(localUrl.pathname)) {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Frontend asset not found');
        return;
      }

      sendFile(request, response, indexFile);
    } catch (error) {
      response.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Temporary backend compatibility gateway failure');
      process.stderr.write(String(error.stack || error) + '\n');
    }
  });

  server.on('upgrade', (request, socket, head) => {
    const remote = connectTls({
      host: upstream.hostname,
      port: Number(upstream.port || 443),
      servername: upstream.hostname,
    }, () => {
      const lines = [request.method + ' ' + request.url + ' HTTP/1.1'];
      for (const [name, value] of Object.entries(request.headers)) {
        if (name.toLowerCase() === 'host') lines.push('host: ' + upstream.host);
        else if (name.toLowerCase() === 'origin') lines.push('origin: ' + upstream.origin);
        else lines.push(name + ': ' + value);
      }
      lines.push('', '');
      remote.write(lines.join('\r\n'));
      if (head.length > 0) remote.write(head);
      socket.pipe(remote).pipe(socket);
    });

    remote.on('error', () => socket.destroy());
    socket.on('error', () => remote.destroy());
  });

  await new Promise((accept, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', accept);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Could not allocate a compatibility gateway port.');
  }

  return {
    server,
    url: 'http://127.0.0.1:' + address.port,
  };
};

const requestJson = async(url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) return undefined;
  return response.json();
};

const identifyBackend = async(target) => {
  const wellKnown = await requestJson(target.url + '/.well-known/nodeinfo');
  const link = wellKnown?.links?.find(({ rel }) => /2\.[01]$/.test(rel));
  const nodeInfo = link?.href ? await requestJson(link.href) : undefined;
  const instance = await requestJson(target.url + '/api/v1/instance');

  return {
    declaredName: target.name,
    title: instance?.title,
    apiVersion: instance?.version,
    software: nodeInfo?.software?.name,
    softwareVersion: nodeInfo?.software?.version,
    upstream: target.url,
  };
};

const chooseAccount = async(gatewayUrl) => {
  const timeline = await requestJson(gatewayUrl + '/api/v1/timelines/public?local=true&limit=1');
  if (Array.isArray(timeline) && timeline[0]?.account?.acct) {
    return timeline[0].account.acct;
  }

  const directory = await requestJson(gatewayUrl + '/api/v1/directory?local=true&limit=1');
  if (Array.isArray(directory) && directory[0]?.acct) {
    return directory[0].acct;
  }

  return '';
};

const runPageAudit = (gatewayUrl, account) =>
  new Promise((accept) => {
    const child = spawn(process.execPath, [pageAudit], {
      cwd: projectRoot,
      env: {
        ...process.env,
        UNFATHOMABLY_AUDIT_URL: gatewayUrl,
        UNFATHOMABLY_AUDIT_ACCOUNT: account,
        UNFATHOMABLY_AUDIT_SETTLE_MS:
          process.env.UNFATHOMABLY_BACKEND_AUDIT_SETTLE_MS || '500',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const stdout = [];
    const stderr = [];
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));

    const timeout = setTimeout(() => child.kill(), 10 * 60 * 1000);
    child.once('exit', (code, signal) => {
      clearTimeout(timeout);
      const output = Buffer.concat(stdout).toString('utf8');
      const errors = Buffer.concat(stderr).toString('utf8').trim();
      let report;
      try {
        report = JSON.parse(output);
      } catch (_error) {
        report = {
          auditedRoutes: 0,
          failures: [],
          signals: [],
          invalidReport: true,
          output: output.slice(0, 2000),
        };
      }
      accept({ code, signal, errors, report });
    });
  });

const auditTarget = async(target) => {
  const identity = await identifyBackend(target);
  const gateway = await createGateway(target);

  try {
    const account = await chooseAccount(gateway.url);
    const audit = await runPageAudit(gateway.url, account);
    return { ...identity, account, ...audit };
  } finally {
    await new Promise((accept) => gateway.server.close(accept));
  }
};

const main = async() => {
  if (!existsSync(indexFile)) {
    throw new Error('Missing dist/index.html. Run the production build first.');
  }

  const results = await Promise.all(readTargets().map(auditTarget));
  const report = {
    generatedAt: new Date().toISOString(),
    frontendVersion: process.env.npm_package_version,
    results,
  };

  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  if (results.some(({ code, report: result }) => code !== 0 || result.failures?.length > 0)) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  process.stderr.write(String(error.stack || error) + '\n');
  process.exitCode = 1;
});

/* end of scripts/audit-backend-compat.mjs */
