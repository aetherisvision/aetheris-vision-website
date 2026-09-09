import { describe, expect, it, vi } from 'vitest'
import { tmpdir } from 'node:os'
import {
  invokeSubscriptionClaude, isSubscriptionAuth, isIsolatedSubscriptionInit, parseSubscriptionResult,
  runProcess, subscriptionArgs, subscriptionEnvironment,
} from '../../scripts/lib/claude-subscription-cli'
import { parseJobInput } from '../../scripts/claude-subscription-worker'

const auth = { loggedIn: true, authMethod: 'claude.ai', apiProvider: 'firstParty', subscriptionType: 'max' }
const initialization = { type: 'system', subtype: 'init', apiKeySource: 'none', tools: [], mcp_servers: [] }
const successfulStream = [initialization, { type: 'result', subtype: 'success', is_error: false, result: 'Valid advice.' }]
  .map(event => JSON.stringify(event)).join('\n')

describe('native subscription CLI boundary', () => {
  it('uses an allowlist so present and future secrets cannot reach Claude', () => {
    const env = subscriptionEnvironment({
      PATH: '/usr/bin', HOME: '/private/example', USER: 'example', LANG: 'en_US.UTF-8',
      ANTHROPIC_API_KEY: 'do-not-pass', ANTHROPIC_AUTH_TOKEN: 'do-not-pass',
      CLAUDE_CODE_OAUTH_TOKEN: 'do-not-pass', CLAUDE_CODE_USE_BEDROCK: '1',
      AWS_ACCESS_KEY_ID: 'do-not-pass', GOOGLE_APPLICATION_CREDENTIALS: '/secret',
      DATABASE_URL: 'do-not-pass', ADMIN_PASSPHRASE: 'do-not-pass', GMAIL_REFRESH_TOKEN: 'do-not-pass',
      NODE_OPTIONS: '--require hostile.js', FUTURE_SECRET: 'do-not-pass',
    })
    expect(env).toEqual({
      NODE_ENV: 'production',
      PATH: '/usr/bin', HOME: '/private/example', USER: 'example', LANG: 'en_US.UTF-8',
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1', DISABLE_AUTOUPDATER: '1',
    })
  })

  it('fails closed for API, Console, unknown, and missing subscription authentication', () => {
    expect(isSubscriptionAuth(auth)).toBe(true)
    for (const value of [null, {}, { ...auth, loggedIn: false }, { ...auth, authMethod: 'api_key' },
      { ...auth, authMethod: 'console' }, { ...auth, apiKeySource: 'ANTHROPIC_API_KEY' },
      { ...auth, subscriptionType: null }, { ...auth, apiProvider: 'bedrock' }]) {
      expect(isSubscriptionAuth(value)).toBe(false)
    }
  })

  it('turns off tools, MCP, project settings, hooks, skills, and persisted sessions without bypassing permissions', () => {
    const args = subscriptionArgs('claude-fable-5', 'Review only.')
    for (const flag of ['--safe-mode', '--strict-mcp-config', '--no-chrome', '--no-session-persistence']) expect(args).toContain(flag)
    expect(args[args.indexOf('--tools') + 1]).toBe('')
    expect(args[args.indexOf('--setting-sources') + 1]).toBe('')
    expect(args[args.indexOf('--mcp-config') + 1]).toBe('{"mcpServers":{}}')
    expect(args[args.indexOf('--permission-mode') + 1]).toBe('dontAsk')
    expect(args).not.toContain('--dangerously-skip-permissions')
    expect(args).not.toContain('--bare')
  })

  it('authenticates before each job, with no model request on an API-only login', async () => {
    const execute = vi.fn().mockResolvedValue({ code: 0, stdout: JSON.stringify({ ...auth, authMethod: 'api_key' }) })
    await expect(invokeSubscriptionClaude({ model: 'claude-fable-5', system: 'Review.', prompt: 'Fake input.' }, '/fake/claude', {}, execute))
      .rejects.toMatchObject({ code: 'claude_subscription_auth' })
    expect(execute).toHaveBeenCalledTimes(1)
    expect(execute.mock.calls[0][0].args.slice(-2)).toEqual(['auth', 'status'])
  })

  it('passes user data on stdin in an empty working directory with a bounded timeout', async () => {
    const execute = vi.fn().mockResolvedValueOnce({ code: 0, stdout: JSON.stringify(auth) })
      .mockResolvedValueOnce({ code: 0, stdout: successfulStream })
    const prompt = 'Untrusted record: $(do not execute)'
    await expect(invokeSubscriptionClaude({ model: 'claude-fable-5', system: 'Review.', prompt }, '/fake/claude', { DATABASE_URL: 'secret' }, execute))
      .resolves.toBe('Valid advice.')
    const modelCall = execute.mock.calls[1][0]
    expect(modelCall.input).toBe(prompt)
    expect(modelCall.args).not.toContain(prompt)
    expect(modelCall.cwd).toContain('av-claude-job-')
    expect(modelCall.timeoutMs).toBe(120_000)
    expect(modelCall.env.DATABASE_URL).toBeUndefined()
    expect(modelCall.requireIsolatedSubscription).toBe(true)
  })

  it('requires the actual model process to report no API key, tools, or MCP servers', () => {
    expect(isIsolatedSubscriptionInit(initialization)).toBe(true)
    for (const event of [null, { ...initialization, apiKeySource: 'user' },
      { ...initialization, tools: ['Bash'] }, { ...initialization, mcp_servers: [{ name: 'unexpected' }] }]) {
      expect(isIsolatedSubscriptionInit(event)).toBe(false)
    }
    expect(parseSubscriptionResult(successfulStream, 0)).toBe('Valid advice.')
    expect(() => parseSubscriptionResult(successfulStream.split('\n').slice(1).join('\n'), 0)).toThrow('claude_subscription_auth')
    expect(() => parseSubscriptionResult(successfulStream.replace('"none"', '"user"'), 0)).toThrow('claude_subscription_auth')
  })

  it('preserves safe auth and limit classifications when the CLI only writes stderr', () => {
    expect(() => parseSubscriptionResult('', 1, 'claude_subscription_auth')).toThrow('claude_subscription_auth')
    expect(() => parseSubscriptionResult('', 1, 'claude_subscription_limit')).toThrow('claude_subscription_limit')
  })

  it('terminates an unresponsive local process and distinguishes generation timeout from queued work', async () => {
    await expect(runProcess({
      binary: process.execPath, args: ['-e', 'setInterval(() => {}, 1000)'],
      cwd: tmpdir(), env: subscriptionEnvironment(process.env), timeoutMs: 25,
    })).rejects.toMatchObject({ code: 'claude_generation_timeout', reason: 'timeout' })
  })

  it('stops on usage limits and rejects partial or malformed model responses', () => {
    expect(() => parseSubscriptionResult(JSON.stringify({ is_error: true, result: "You've hit your limit. Resets soon." }), 1))
      .toThrow('claude_subscription_limit')
    for (const text of ['broken JSON', JSON.stringify({ subtype: 'success', result: '' }), JSON.stringify({ subtype: 'error_max_turns', result: 'partial' })]) {
      expect(() => parseSubscriptionResult(text, 0)).toThrow()
    }
  })

  it('accepts only supported job kinds and a fixed approved model', () => {
    const input = { model: 'claude-fable-5', system: 'Review.', prompt: 'Fake opportunity.' }
    expect(parseJobInput({ id: 'job', kind: 'lead_email', input })).toEqual(input)
    expect(() => parseJobInput({ id: 'job', kind: 'shell', input })).toThrow()
    expect(() => parseJobInput({ id: 'job', kind: 'assistant', input: { ...input, model: '--dangerous' } })).toThrow()
  })
})
