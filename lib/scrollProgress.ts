/**
 * A tiny framework-agnostic store that holds the current scroll progress (0..1).
 *
 * Why not React state? The animation is scrubbed to the scroll position and read
 * every frame inside the R3F render loop. Pushing it through React state would
 * trigger a re-render per scroll event and cause jank. Instead GSAP writes the
 * value here and consumers read it imperatively (useFrame for the 3D scene,
 * direct DOM mutation for labels).
 */

type Listener = (progress: number) => void;

let progress = 0;
const listeners = new Set<Listener>();

export const scrollProgress = {
  get(): number {
    return progress;
  },
  set(value: number): void {
    progress = Math.min(1, Math.max(0, value));
    listeners.forEach((listener) => listener(progress));
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    // Push the current value immediately so late subscribers are in sync.
    listener(progress);
    return () => listeners.delete(listener);
  },
};

/** Smoothstep easing — gives the "heavy / cinematic" feel to derived values. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
