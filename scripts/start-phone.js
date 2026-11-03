const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const port = 8081;
let metroHost = '127.0.0.1';
const envFile = path.join(__dirname, '..', '.env.local');

function interfaces() {
  try {
    const out = execFileSync('ip', ['-4', '-o', 'addr', 'show'], { encoding: 'utf8' });
    const rows = out.split('\n').map((line) => {
      const match = line.match(/^\d+:\s+(\S+)\s+inet\s+(\d+\.\d+\.\d+\.\d+)/);
      return match ? { iface: match[1], ip: match[2] } : null;
    }).filter(Boolean);
    if (rows.length) return rows;
  } catch {
    // Windows has no ip(8). Fall through to Node's interface list.
  }
  const rows = [];
  for (const [iface, addrs] of Object.entries(os.networkInterfaces())) {
    for (const addr of addrs ?? []) {
      const v4 = addr.family === 'IPv4' || addr.family === 4;
      if (v4 && !addr.internal) rows.push({ iface, ip: addr.address });
    }
  }
  return rows;
}

function defaultInterface() {
  try {
    const line = execFileSync('ip', ['-4', 'route', 'show', 'default'], { encoding: 'utf8' }).split('\n')[0] ?? '';
    return line.match(/\bdev\s+(\S+)/)?.[1] ?? '';
  } catch {
    return '';
  }
}

function savedAddress() {
  if (!fs.existsSync(envFile)) return '';
  const line = fs.readFileSync(envFile, 'utf8').split('\n').find((row) => row.startsWith('REACT_NATIVE_PACKAGER_HOSTNAME='));
  return line ? line.slice('REACT_NATIVE_PACKAGER_HOSTNAME='.length).trim() : '';
}

function remember(hostname) {
  const next = `REACT_NATIVE_PACKAGER_HOSTNAME=${hostname}`;
  const body = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
  const updated = body.includes('REACT_NATIVE_PACKAGER_HOSTNAME=')
    ? body.replace(/^REACT_NATIVE_PACKAGER_HOSTNAME=.*$/m, next)
    : `${body}${body.endsWith('\n') || body.length === 0 ? '' : '\n'}${next}\n`;
  fs.writeFileSync(envFile, updated.endsWith('\n') ? updated : `${updated}\n`);
}

function isWifi(name) {
  return /^(wl|wlan|wi-?fi)/i.test(name);
}

function isVirtual(name) {
  return /vethernet|virtual|vmware|hyper-v|wsl|loopback|bluetooth|npcap|tunnel/i.test(name);
}

function isPrivate(ip) {
  return ip.startsWith('192.168.') || ip.startsWith('10.') || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip);
}

function chooseHostname() {
  const rows = interfaces().filter((row) => isPrivate(row.ip) && !isVirtual(row.iface));
  const wifi = rows.filter((row) => isWifi(row.iface));
  const preferred = wifi.find((row) => row.iface === defaultInterface()) ?? wifi[0] ?? rows[0];
  if (preferred) return preferred.ip;
  const saved = savedAddress();
  return interfaces().some((row) => row.ip === saved) ? saved : '';
}

function canReach(host) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.setTimeout(400, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function probeHost(host) {
  return new Promise((resolve) => {
    const probe = net.connect({ host, port }, () => {
      probe.end();
      resolve(true);
    });
    probe.on('error', () => resolve(false));
    probe.setTimeout(400, () => {
      probe.destroy();
      resolve(false);
    });
  });
}

async function waitForLocalPort() {
  for (;;) {
    if (await probeHost('127.0.0.1')) {
      metroHost = '127.0.0.1';
      return;
    }
    if (await probeHost('::1')) {
      metroHost = '::1';
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
}

function waitUntilFree() {
  return new Promise((resolve) => {
    const wait = setInterval(() => {
      const probe = net.connect({ host: metroHost, port }, () => {
        probe.end();
      });
      probe.on('error', () => {
        clearInterval(wait);
        resolve();
      });
    }, 200);
  });
}

function responseHeaders(headers) {
  const next = { ...headers };
  delete next['transfer-encoding'];
  delete next.connection;
  delete next['keep-alive'];
  return next;
}

function listenOn(hostname) {
  const server = http.createServer((req, res) => {
    const upstream = http.request({
      host: metroHost,
      port,
      method: req.method,
      path: req.url,
      headers: req.headers,
    }, (up) => {
      const type = String(up.headers['content-type'] || '');
      const acceptsGzip = String(req.headers['accept-encoding'] || '').includes('gzip');
      const compressible = /javascript|json|text/.test(type) && !up.headers['content-encoding'];
      if (!acceptsGzip || !compressible || up.statusCode !== 200) {
        res.writeHead(up.statusCode || 502, responseHeaders(up.headers));
        up.pipe(res);
        return;
      }
      const headers = responseHeaders(up.headers);
      headers['content-encoding'] = 'gzip';
      delete headers['content-length'];
      res.writeHead(up.statusCode, headers);
      up.pipe(zlib.createGzip({ level: zlib.constants.Z_BEST_SPEED })).pipe(res);
    });
    upstream.on('error', () => {
      if (!res.headersSent) res.writeHead(502);
      res.end();
    });
    req.pipe(upstream);
  });
  server.requestTimeout = 0;
  server.headersTimeout = 0;
  server.timeout = 0;
  server.on('upgrade', (req, socket, head) => {
    const upstream = net.connect({ host: metroHost, port }, () => {
      const headerLines = Object.entries(req.headers).map(([key, value]) => `${key}: ${value}`);
      upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${headerLines.join('\r\n')}\r\n\r\n`);
      if (head.length) upstream.write(head);
      socket.pipe(upstream);
      upstream.pipe(socket);
    });
    const close = () => {
      socket.destroy();
      upstream.destroy();
    };
    socket.on('error', close);
    upstream.on('error', close);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, hostname, () => resolve(server));
  });
}

async function start(hostname) {
  remember(hostname);
  const expo = spawn('npx', ['expo', 'start', '--localhost', '--port', String(port)], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: hostname, EXPO_NO_METRO_LAZY: '1' },
  });
  await waitForLocalPort();
  const server = await listenOn(hostname);
  const subnet = hostname.split('.').slice(0, 3).join('.');
  console.log(`\nPhone: exp://${hostname}:${port}`);
  console.log(`The phone must be on Wi-Fi ${subnet}.x`);
  console.log(`Web:   http://localhost:${port}\n`);
  return { expo, server, hostname };
}

async function stop(running) {
  running.server.close();
  if (running.expo.exitCode != null || running.expo.signalCode) {
    await waitUntilFree();
    return;
  }
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 4000);
    running.expo.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    running.expo.kill('SIGTERM');
  });
  await waitUntilFree();
}

async function main() {
  const hostname = chooseHostname();
  if (!hostname) {
    console.error('No Wi-Fi address found. Connect this computer to the same Wi-Fi as the phone.');
    process.exit(1);
  }
  if (await canReach(hostname)) {
    console.log(`Already running.\nPhone: exp://${hostname}:${port}\nWeb:   http://localhost:${port}`);
    process.exit(0);
  }

  let restarting = false;
  let running = await start(hostname);
  running.expo.on('exit', (code) => {
    if (!restarting) process.exit(code ?? 0);
  });

  const shutdown = () => {
    restarting = true;
    running.expo.kill('SIGTERM');
    running.server.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  setInterval(() => {
    if (restarting) return;
    const next = chooseHostname();
    if (!next || next === running.hostname) return;
    restarting = true;
    console.log(`\nWi-Fi address changed to ${next}. Restarting so the phone does not keep the old link.\n`);
    stop(running).then(async () => {
      running = await start(next);
      running.expo.on('exit', (code) => {
        if (!restarting) process.exit(code ?? 0);
      });
      restarting = false;
    }).catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
  }, 4000);
}

void main();
