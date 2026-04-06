import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const frontendRoot = resolve(__dirname, '..')
const repoRoot = resolve(frontendRoot, '..')
const isWin = process.platform === 'win32'

const pythonCommand = process.env.BAPP_PYTHON || 'python'
const npmCommand = isWin ? 'npm.cmd' : 'npm'

const api = spawn(
  pythonCommand,
  ['Bapp.py', '--api', '--port', '8765'],
  {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: isWin,
    env: {
      ...process.env,
      BAPP_APP_ROOT: repoRoot,
    },
  },
)

const web = spawn(
  npmCommand,
  ['run', 'dev:vite'],
  {
    cwd: frontendRoot,
    stdio: 'inherit',
    shell: isWin,
    env: {
      ...process.env,
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8765',
    },
  },
)

function shutdown(code = 0) {
  if (!api.killed) api.kill()
  if (!web.killed) web.kill()
  process.exit(code)
}

api.on('exit', (code) => {
  if (code && code !== 0) shutdown(code)
})

web.on('exit', (code) => {
  shutdown(code ?? 0)
})

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
