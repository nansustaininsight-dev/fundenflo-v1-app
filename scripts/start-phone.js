const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const port = 8081;

function wifiAddress() {
  try {
    const out = execFileSync('ip', ['-4', '-o', 'addr', 'show'], { encoding: 'utf8' });
    const rows = out.split('\n').map((line) => {
      const match = line.match(/^\d+:\s+(\S+)\s+inet\s+(\d+\.\d+\.\d+\.\d+)/);
      return match ? { iface: match[1], ip: match[2] } : null;
    }).filter(Boolean);
    return rows.find((row) => row.iface.startsWith('wl'))?.ip ?? '';
  } catch {
    return '';
  }
}

function savedAddress() {
  const file = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(file)) return '';
  const line = fs.readFileSync(file, 'utf8').split('\n').find((row) => row.startsWith('REACT_NATIVE_PACKAGER_HOSTNAME='));
  return line ? line.slice('REACT_NATIVE_PACKAGER_HOSTNAME='.length).trim() : '';
}

function canReach(host) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });
}

const hostname = wifiAddress() || savedAddress();

async function main() {
  if (!hostname) {
    console.error('No Wi-Fi address found. Connect this computer to the same Wi-Fi as the phone.');
    process.exit(1);
  }
  if (await canReach(hostname)) {
    console.log(`Already running.\nPhone: exp://${hostname}:${port}\nWeb:   http://localhost:${port}`);
    process.exit(0);
  }

  const expo = spawn('npx', ['expo', 'start', '--localhost', '--port', String(port)], {
    stdio: 'inherit',
    env: { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: hostname },
  });

  const stop = () => {
    expo.kill('SIGTERM');
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  expo.on('exit', (code) => process.exit(code ?? 0));

  await new Promise((resolve) => {
    const wait = setInterval(() => {
      const probe = net.connect({ host: '127.0.0.1', port }, () => {
        probe.end();
        clearInterval(wait);
        resolve();
      });
      probe.on('error', () => probe.destroy());
    }, 400);
  });

  const server = net.createServer((socket) => {
    const upstream = net.connect({ host: '127.0.0.1', port });
    const close = () => {
      socket.destroy();
      upstream.destroy();
    };
    socket.on('error', close);
    upstream.on('error', close);
    upstream.on('connect', () => {
      socket.pipe(upstream);
      upstream.pipe(socket);
    });
  });
  server.on('error', (error) => {
    console.error(error.message);
    expo.kill('SIGTERM');
    process.exit(1);
  });
  server.listen(port, hostname, () => {
    console.log(`\nPhone: exp://${hostname}:${port}\nWeb:   http://localhost:${port}\n`);
  });
}

void main();
