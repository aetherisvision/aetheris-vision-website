import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export class SubscriptionCliError extends Error {
  constructor(
    readonly code: 'claude_subscription_auth' | 'claude_subscription_limit' | 'claude_job_failed' | 'claude_generation_timeout',
    readonly reason?: 'timeout' | 'output_limit' | 'process_error' | 'isolation_failed',
  ) {
    super(code)
  }
}

/** Pass no API/provider credentials, NODE_OPTIONS, database secrets, or Gmail tokens. */
type SourceEnvironment = Readonly<Record<string, string | undefined>>

export function subscriptionEnvironment(source: SourceEnvironment): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { NODE_ENV: 'production' }
  for (const key of ['PATH', 'HOME', 'USER', 'LOGNAME', 'TMPDIR', 'LANG', 'LC_ALL', 'CLAUDE_CONFIG_DIR']) {
    if (source[key]) env[key] = source[key]
  }
  env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = '1'
  env.DISABLE_AUTOUPDATER = '1'
  return env
}

export function isSubscriptionAuth(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const auth = value as Record<string, unknown>
  return auth.loggedIn === true && auth.authMethod === 'claude.ai'
    && auth.apiProvider === 'firstParty' && !auth.apiKeySource
    && ['pro', 'max', 'team', 'enterprise'].includes(String(auth.subscriptionType).toLowerCase())
}

const ISOLATION_ARGS = ['--safe-mode', '--setting-sources', '', '--no-chrome']

export function subscriptionArgs(model: string, system: string, effort = 'medium'): string[] {
  return [
    ...ISOLATION_ARGS,
    '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
    '--tools', '', '--permission-mode', 'dontAsk',
    '--no-session-persistence', '--output-format', 'stream-json', '--verbose',
    '--model', model, '--effort', effort, '--system-prompt', system, '--print',
  ]
}

interface ProcessOptions {
  binary: string
  args: string[]
  cwd: string
  env: NodeJS.ProcessEnv
  input?: string
  timeoutMs: number
  requireIsolatedSubscription?: boolean
}

export function isIsolatedSubscriptionInit(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const event = value as Record<string, unknown>
  return event.type === 'system' && event.subtype === 'init' && event.apiKeySource === 'none'
    && Array.isArray(event.tools) && event.tools.length === 0
    && Array.isArray(event.mcp_servers) && event.mcp_servers.length === 0
}

export function runProcess(options: ProcessOptions): Promise<{
  code: number; stdout: string;
  diagnosticCode?: 'claude_subscription_auth' | 'claude_subscription_limit' | 'claude_job_failed'
}> {
  return new Promise((resolve, reject) => {
    const child = spawn(options.binary, options.args, {
      cwd: options.cwd, env: options.env, shell: false, stdio: ['pipe', 'pipe', 'pipe'],
    })
    let output = ''
    let stderrTail = ''
    let eventBuffer = ''
    let bytes = 0
    let stopped = false
    let stopReason: 'timeout' | 'output_limit' | 'isolation_failed' = 'timeout'
    let killTimer: NodeJS.Timeout | undefined
    const stop = () => {
      stopped = true
      child.kill('SIGTERM')
      killTimer = setTimeout(() => child.kill('SIGKILL'), 2000)
    }
    const timer = setTimeout(stop, options.timeoutMs)
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      bytes += Buffer.byteLength(chunk)
      if (bytes > 2_000_000) { stopReason = 'output_limit'; if (!stopped) stop(); return }
      output += chunk
      if (options.requireIsolatedSubscription) {
        eventBuffer += chunk
        let newline: number
        while ((newline = eventBuffer.indexOf('\n')) >= 0) {
          const line = eventBuffer.slice(0, newline)
          eventBuffer = eventBuffer.slice(newline + 1)
          try {
            const event = JSON.parse(line)
            if (event?.type === 'system' && event.subtype === 'init' && !isIsolatedSubscriptionInit(event)) {
              stopReason = 'isolation_failed'
              if (!stopped) stop()
            }
          } catch { /* The final parser rejects malformed output. */ }
        }
      }
    })
    // Classify a bounded tail in memory; never persist, return, or log the raw diagnostic.
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk: string) => { stderrTail = (stderrTail + chunk).slice(-2048) })
    child.on('error', () => {
      clearTimeout(timer)
      if (killTimer) clearTimeout(killTimer)
      reject(new SubscriptionCliError('claude_job_failed', 'process_error'))
    })
    child.on('close', code => {
      clearTimeout(timer)
      if (killTimer) clearTimeout(killTimer)
      const diagnosticCode = errorCode(stderrTail)
      stderrTail = ''
      if (stopped) reject(new SubscriptionCliError(
        stopReason === 'isolation_failed' ? 'claude_subscription_auth'
          : stopReason === 'timeout' ? 'claude_generation_timeout' : diagnosticCode, stopReason,
      ))
      else resolve({ code: code ?? 1, stdout: output, diagnosticCode })
    })
    child.stdin.on('error', () => {})
    child.stdin.end(options.input ?? '')
  })
}

function errorCode(text: string): 'claude_subscription_auth' | 'claude_subscription_limit' | 'claude_job_failed' {
  if (/not logged in|login expired|run \/login|authentication|unauthorized/i.test(text)) return 'claude_subscription_auth'
  if (/rate.limit|usage.limit|hit your limit|out of.*usage|limit.*reset/i.test(text)) return 'claude_subscription_limit'
  return 'claude_job_failed'
}

export function parseSubscriptionResult(stdout: string, exitCode: number, diagnosticCode = 'claude_job_failed'): string {
  if (exitCode !== 0 && ['claude_subscription_auth', 'claude_subscription_limit'].includes(diagnosticCode)) {
    throw new SubscriptionCliError(diagnosticCode as 'claude_subscription_auth' | 'claude_subscription_limit')
  }
  let events: Record<string, unknown>[]
  try {
    events = stdout.trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
    if (events.some(event => !event || typeof event !== 'object' || Array.isArray(event))) throw new Error('Invalid event')
  } catch { throw new SubscriptionCliError(errorCode(stdout)) }
  const result = events.findLast(event => event.type === 'result')
  if (!result) throw new SubscriptionCliError(errorCode(stdout))
  if (exitCode !== 0 || result.is_error || result.subtype !== 'success') {
    throw new SubscriptionCliError(errorCode(JSON.stringify(result)))
  }
  const initializations = events.filter(event => event.type === 'system' && event.subtype === 'init')
  if (initializations.length !== 1 || !isIsolatedSubscriptionInit(initializations[0])) {
    throw new SubscriptionCliError('claude_subscription_auth', 'isolation_failed')
  }
  if (typeof result.result !== 'string' || !result.result.trim() || result.result.length > 30_000) {
    throw new SubscriptionCliError('claude_job_failed')
  }
  return result.result.trim()
}

type Executor = typeof runProcess

export async function checkSubscriptionAuth(
  binary: string,
  source: SourceEnvironment = process.env,
  execute: Executor = runProcess,
): Promise<boolean> {
  const cwd = await mkdtemp(join(tmpdir(), 'av-claude-auth-'))
  try {
    const result = await execute({
      binary, args: [...ISOLATION_ARGS, 'auth', 'status'], cwd,
      env: subscriptionEnvironment(source), timeoutMs: 15_000,
    })
    try { return result.code === 0 && isSubscriptionAuth(JSON.parse(result.stdout)) } catch { return false }
  } finally { await rm(cwd, { recursive: true, force: true }) }
}

export async function invokeSubscriptionClaude(
  input: { model: string; system: string; prompt: string },
  binary: string,
  source: SourceEnvironment = process.env,
  execute: Executor = runProcess,
  options: { timeoutMs?: number; effort?: 'low' | 'medium' | 'high' } = {},
): Promise<string> {
  // Check the active billing source before EVERY model invocation, not only at startup.
  if (!await checkSubscriptionAuth(binary, source, execute)) {
    throw new SubscriptionCliError('claude_subscription_auth')
  }
  const cwd = await mkdtemp(join(tmpdir(), 'av-claude-job-'))
  try {
    const result = await execute({
      binary, args: subscriptionArgs(input.model, input.system, options.effort), cwd,
      env: subscriptionEnvironment(source), input: input.prompt,
      timeoutMs: Math.min(300_000, Math.max(1000, options.timeoutMs ?? 120_000)),
      requireIsolatedSubscription: true,
    })
    return parseSubscriptionResult(result.stdout, result.code, result.diagnosticCode)
  } finally { await rm(cwd, { recursive: true, force: true }) }
}
