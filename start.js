const { spawn } = require('child_process');
const path = require('path');

const rootDir = __dirname;

console.log('=================================================');
console.log('   🚀 Starting SpendWise Financial Application   ');
console.log('=================================================');

function runService(name, cwd, cmd, args, color) {
  const proc = spawn(cmd, args, {
    cwd,
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  proc.stdout.on('data', (data) => {
    process.stdout.write(`${color}[${name}]\x1b[0m ${data}`);
  });

  proc.stderr.on('data', (data) => {
    process.stderr.write(`${color}[${name}]\x1b[0m \x1b[31m${data}\x1b[0m`);
  });

  proc.on('close', (code) => {
    console.log(`${color}[${name}]\x1b[0m Exited with code ${code}`);
  });

  return proc;
}

const backend = runService('BACKEND', path.join(rootDir, 'backend'), 'npm', ['start'], '\x1b[36m');
const frontend = runService('FRONTEND', path.join(rootDir, 'frontend'), 'npm', ['run', 'dev'], '\x1b[32m');

function shutdown() {
  console.log('\n🛑 Stopping SpendWise services...');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
