"use client";

import { Html, useProgress } from "@react-three/drei";

/** Minimal, on-brand loader shown inside the Canvas while the GLB streams in. */
export default function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 text-ink/70">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-clinical/20 border-t-clinical" />
        <span className="text-xs font-medium tracking-wide tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>
    </Html>
  );
}
