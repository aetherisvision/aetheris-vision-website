/**
 * Scrolls a hash-link target into view, retrying briefly if the element isn't
 * in the DOM yet.
 *
 * Next.js App Router's built-in `<Link href="/#id">` scroll behavior only
 * promises to scroll the destination *page* into view on a cross-route
 * navigation — not the specific `id` within it — and does nothing at all for
 * a same-route hash change. Sections on this page are also gated behind
 * FadeIn's IntersectionObserver, so the target can still be settling into
 * layout for a frame or two after the route change lands. A short retry
 * window covers that without a hard dependency on any particular timing.
 */
export function scrollToHash(id: string, attempt = 0): void {
  const target = document.getElementById(id);
  if (!target) {
    if (attempt >= 20) return; // ~1s at 50ms — the id genuinely isn't on this page
    window.setTimeout(() => scrollToHash(id, attempt + 1), 50);
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}
