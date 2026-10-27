import type { Clock } from "three";

/**
 * Observe the hero canvas that is actually mounted.
 * Passing null disconnects the previous observer so a later canvas, after
 * reduced motion removes and restores the tree, is the one that pauses drawing.
 */
export function attachHeroVisibilityObserver(
  node: Element | null,
  current: IntersectionObserver | null,
  onChange: (visible: boolean) => void,
): IntersectionObserver | null {
  current?.disconnect();
  if (!node || typeof IntersectionObserver === "undefined") return null;

  const observer = new IntersectionObserver(([entry]) => {
    if (!entry) return;
    onChange(entry.isIntersecting);
  });
  observer.observe(node);
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
