/** Local subscription worker: database secret stays in process memory. */
import { execFileSync, spawn } from 'node:child_process'

const project = 'lucid-loader-493512-g1'
const connection = execFileSync('/opt/homebrew/bin/gcloud', [
  'secrets', 'versions', 'access', 'latest', '--secret=avcrm-database-url',
  `--project=${project}`, `--billing-project=${project}`,
  '--account=marston@aetherisvision.com',
], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const url = new URL(connection)
url.hostname = '127.0.0.1'
url.port = '55440'
url.searchParams.set('sslmode', 'disable') // Localhost-only authenticated Cloud SQL proxy.
const child = spawn(process.execPath, ['--import', 'tsx', 'scripts/claude-subscription-worker.ts'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, DATABASE_DRIVER: 'postgres', DATABASE_URL: String(url), CLOUD_SQL_CONNECTION_NAME: '' },
  stdio: 'inherit',
})
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal))
child.on('error', () => { console.error('Could not start CRM subscription worker'); process.exitCode = 1 })
child.on('exit', code => { process.exitCode = code ?? 1 })
