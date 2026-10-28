import type { Clock } from "three";

const visibilityCleanup = new WeakMap<IntersectionObserver, () => void>();

/**
 * Observe the hero canvas that is actually mounted.
 * Passing null disconnects the previous observer so a later canvas, after
 * reduced motion removes and restores the tree, is the one that pauses drawing.
 * Also pauses drawing when the document tab is hidden (e.g. Opera Battery Saver
 * or backgrounded tabs in Brave, Firefox, and Chromium).
 */
export function attachHeroVisibilityObserver(
  node: Element | null,
  current: IntersectionObserver | null,
  onChange: (visible: boolean) => void,
): IntersectionObserver | null {
  if (current) {
    visibilityCleanup.get(current)?.();
    visibilityCleanup.delete(current);
    current.disconnect();
  }
  if (!node || typeof IntersectionObserver === "undefined") return null;

  let isIntersecting = true;
  const isDocumentVisible = () =>
    typeof document === "undefined" || document.visibilityState !== "hidden";

  const observer = new IntersectionObserver(([entry]) => {
    if (!entry) return;
    isIntersecting = entry.isIntersecting;
    onChange(isIntersecting && isDocumentVisible());
  });
  observer.observe(node);

  if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
    const onVisibilityChange = () => {
      onChange(isIntersecting && isDocumentVisible());
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    visibilityCleanup.set(observer, () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    });
  }

  return observer;
}

/**
 * R3F's setFrameloop zeros clock.elapsedTime whenever drawing pauses or resumes.
 * drei's Stars sample that clock, so put the pre-pause time back after the
 * frameloop switch. On resume, oldTime is "now" so the paused gap is not added.
 */
export function restoreHeroStarTime(clock: Clock, elapsedTime: number, resume: boolean): void {
  clock.elapsedTime = elapsedTime;
  if (resume) clock.oldTime = performance.now();
}
