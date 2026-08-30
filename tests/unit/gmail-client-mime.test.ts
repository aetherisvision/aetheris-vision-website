import { describe, expect, it } from 'vitest'

import { buildDraftRawMessage } from '@/lib/gmail-client'

function decode(raw: string): string {
  return Buffer.from(raw, 'base64url').toString('utf8')
}

describe('buildDraftRawMessage', () => {
  it('builds a multipart message with a base64 HTML body and no attachment', () => {
    const raw = buildDraftRawMessage({
      to: 'officer@ferc.gov',
      subject: 'Aetheris Vision -- following up',
      htmlBody: '<p>Hi</p>',
    })

    const message = decode(raw)
    expect(message).toContain('To: officer@ferc.gov')
    expect(message).toContain('Subject: Aetheris Vision -- following up')
    expect(message).toContain('Content-Type: multipart/mixed')
    expect(message).toContain('Content-Type: text/html; charset="UTF-8"')
    expect(message).toContain(Buffer.from('<p>Hi</p>', 'utf8').toString('base64'))
    expect(message).not.toContain('Content-Disposition: attachment')
  })

  it('adds a base64 attachment part with Content-Disposition when given one', () => {
    const raw = buildDraftRawMessage({
      to: 'lead@example.com',
      subject: 'x',
      htmlBody: '<p>y</p>',
      attachment: {
        filename: 'Aetheris-Vision-Capability-Statement.pdf',
        mimeType: 'application/pdf',
        base64Content: 'ZmFrZS1wZGY=',
      },
    })

    const message = decode(raw)
    expect(message).toContain('Content-Type: application/pdf; name="Aetheris-Vision-Capability-Statement.pdf"')
    expect(message).toContain('Content-Disposition: attachment; filename="Aetheris-Vision-Capability-Statement.pdf"')
    expect(message).toContain('ZmFrZS1wZGY=')
  })

  it('wraps a long base64 attachment payload to 76-character lines (RFC 2045)', () => {
    const longBase64 = 'A'.repeat(200)
    const raw = buildDraftRawMessage({
      to: 'lead@example.com',
      subject: 'x',
      htmlBody: '<p>y</p>',
      attachment: { filename: 'x.pdf', mimeType: 'application/pdf', base64Content: longBase64 },
    })

    const message = decode(raw)
    const attachmentLines = message
      .split('\r\n')
      .filter((line) => line.length > 0 && /^A+$/.test(line))
    expect(attachmentLines.length).toBeGreaterThan(1)
    for (const line of attachmentLines) expect(line.length).toBeLessThanOrEqual(76)
    expect(attachmentLines.join('')).toBe(longBase64)
  })

  it('RFC 2047-encodes a non-ASCII subject instead of embedding raw bytes', () => {
    const raw = buildDraftRawMessage({
      to: 'lead@example.com',
      subject: 'Aetheris Vision — café',
      htmlBody: '<p>y</p>',
    })

    const message = decode(raw)
    expect(message).toMatch(/^Subject: =\?UTF-8\?B\?/m)
    expect(message).not.toContain('café')
  })

  it('rejects a "to" address containing a CRLF header-injection attempt', () => {
    expect(() =>
      buildDraftRawMessage({
        to: 'lead@example.com\r\nBcc: attacker@example.com',
        subject: 'x',
        htmlBody: '<p>y</p>',
      }),
    ).toThrow(/to must not contain line breaks/)
  })

  it('rejects a subject containing a bare LF', () => {
    expect(() =>
      buildDraftRawMessage({
        to: 'lead@example.com',
        subject: 'x\nBcc: attacker@example.com',
        htmlBody: '<p>y</p>',
      }),
    ).toThrow(/subject must not contain line breaks/)
  })

  it('rejects an attachment filename containing a CRLF or a quote', () => {
    expect(() =>
      buildDraftRawMessage({
        to: 'lead@example.com',
        subject: 'x',
        htmlBody: '<p>y</p>',
        attachment: { filename: 'a\r\nX-Evil: 1.pdf', mimeType: 'application/pdf', base64Content: 'AA==' },
      }),
    ).toThrow(/attachment filename must not contain line breaks/)

    expect(() =>
      buildDraftRawMessage({
        to: 'lead@example.com',
        subject: 'x',
        htmlBody: '<p>y</p>',
        attachment: { filename: 'a".pdf', mimeType: 'application/pdf', base64Content: 'AA==' },
      }),
    ).toThrow(/must not contain a quote character/)
  })
})
