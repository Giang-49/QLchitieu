const { spawn, spawnSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const { createServer } = require('node:net');
const { join, resolve } = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

const root = resolve(__dirname, '..');
const backend = join(root, 'backend');
const environmentFile = join(backend, '.env');
const nest = join(backend, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');
const prisma = join(backend, 'node_modules', 'prisma', 'build', 'index.js');
const generatedSchema = join(backend, 'node_modules', '.prisma', 'client', 'schema.prisma');
const npm = process.env.npm_execpath;

function run(command, args, cwd = backend) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(args.join(' ') + ' dừng với mã ' + result.status);
}

function runNpm(...args) {
  if (!npm) throw new Error('Khởi động bằng lệnh npm run demo.');
  run(process.execPath, [npm, ...args]);
}

function ensurePortIsFree(port, host) {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(port, host, () => probe.close(resolve));
  });
}

async function choosePort(configured, host, allowFallback) {
  const lastPort = allowFallback ? configured + 10 : configured;
  for (let port = configured; port <= lastPort; port++) {
    try {
      await ensurePortIsFree(port, host);
      if (port !== configured) console.log('Cổng ' + configured + ' đang bận. SmartMoney sẽ dùng cổng ' + port + '.');
      return port;
    } catch (error) {
      if (error.code !== 'EADDRINUSE') throw error;
    }
  }
  throw new Error('Cổng ' + configured + ' đang bận. Đổi PORT trong backend/.env rồi chạy lại.');
}

async function waitForDatabase() {
  const { PrismaClient } = require(join(backend, 'node_modules', '@prisma/client'));
  const client = new PrismaClient();
  const deadline = Date.now() + 75_000;
  try {
    while (true) {
      try {
        await client.user.findFirst({ select: { id: true } });
        return;
      } catch (error) {
        const code = error.code || error.errorCode;
        if (code === 'P2021') throw new Error('MySQL chưa có các bảng SmartMoney. Kiểm tra database/schema.sql.');
        if (!['P1001', 'P1002', 'P1017'].includes(code) || Date.now() >= deadline) {
          throw new Error('Không kết nối được MySQL (' + (code || error.name) + '). Kiểm tra Docker và backend/.env.');
        }
        await delay(1500);
      }
    }
  } finally {
    await client.$disconnect();
  }
}

async function start() {
  if (Number(process.versions.node.split('.')[0]) < 22) {
    throw new Error('SmartMoney cần Node.js 22 trở lên.');
  }
  if (!existsSync(environmentFile)) {
    const template = readFileSync(join(backend, '.env.example'), 'utf8');
    const config = template.replace(/^JWT_SECRET=.*$/m, 'JWT_SECRET="' + randomBytes(32).toString('hex') + '"');
    writeFileSync(environmentFile, config, { flag: 'wx' });
    console.log('Đã tạo backend/.env từ mẫu.');
  }
  const explicitPort = Boolean(process.env.PORT);
  process.loadEnvFile(environmentFile);

  const configured = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  if (!Number.isInteger(configured) || configured < 1 || configured > 65535) {
    throw new Error('PORT trong backend/.env không hợp lệ.');
  }
  const port = await choosePort(configured, host, configured === 3000 && !explicitPort);

  if (process.env.SMARTMONEY_SKIP_DOCKER !== '1') {
    console.log('Khởi động MySQL bằng Docker Compose…');
    run('docker', ['compose', 'up', '-d', '--no-recreate', 'mysql'], root);
  }

  if (!existsSync(nest) || !existsSync(prisma)) runNpm('ci');
  if (!existsSync(generatedSchema)) {
    run(process.execPath, [prisma, 'generate']);
  }

  console.log('Đang chờ MySQL mở các bảng SmartMoney…');
  await waitForDatabase();
  runNpm('run', 'db:seed:demo');
  run(process.execPath, [nest, 'build']);

  const url = 'http://localhost:' + port;
  const hostForHealth = host === '0.0.0.0' ? '127.0.0.1' : host === '::' ? '::1' : host;
  const healthHost = hostForHealth.includes(':') ? '[' + hostForHealth + ']' : hostForHealth;
  const healthUrl = 'http://' + healthHost + ':' + port + '/api/v1';
  const server = spawn(process.execPath, ['dist/main.js'], {
    cwd: backend,
    env: { ...process.env, PORT: String(port), SMARTMONEY_DEMO: '1' },
    stdio: 'inherit',
  });
  server.once('error', (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  server.once('exit', (code) => { if (code) process.exitCode = code; });
  const stop = () => { if (server.exitCode === null) server.kill(); };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  for (let attempt = 0; attempt < 40 && server.exitCode === null && server.signalCode === null; attempt++) {
    try {
      const response = await fetch(healthUrl, { signal: AbortSignal.timeout(1000) });
      if (response.ok) {
        console.log('\nSmartMoney sẵn sàng: ' + url);
        console.log('Tài khoản mẫu: demo@sochi.test / SoChiDemo2026!');
        return;
      }
    } catch { /* NestJS đang khởi động. */ }
    await delay(500);
  }
  if (server.exitCode === null) stop();
  throw new Error('API chưa sẵn sàng. Kiểm tra nhật ký máy chủ và cổng ' + port + '.');
}

start().catch((error) => {
  console.error('\nKhông thể chạy SmartMoney: ' + error.message);
  process.exitCode = 1;
});
