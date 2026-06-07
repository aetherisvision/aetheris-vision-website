import { describe, it, expect } from "vitest";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

/**
 * Guards the #8 fix: the admin document preview renders `marked()` output via
 * dangerouslySetInnerHTML. marked v17 does NOT sanitize, so the component runs
 * the output through DOMPurify first. These tests assert that pipeline strips
 * active content while preserving benign formatting.
 */
function renderSafe(md: string): string {
  return DOMPurify.sanitize(marked(md) as string);
}

describe("admin document markdown sanitization", () => {
  it("strips <script> tags from document content", () => {
    const html = renderSafe('# Title\n\n<script>alert("xss")</script>');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(");
  });

  it("strips event-handler attributes like img onerror", () => {
    const html = renderSafe('<img src="x" onerror="alert(1)">');
    expect(html).not.toContain("onerror");
  });

  it("preserves benign markdown formatting", () => {
    const html = renderSafe("# Heading\n\n**bold** and a [link](https://example.com)");
    expect(html).toContain("<h1");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain('href="https://example.com"');
  });
});
