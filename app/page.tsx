"use client";

import dynamic from "next/dynamic";
import ScrollSection from "@/components/ScrollSection";

// The 3D scene is client-only (WebGL has no SSR) and code-split so the page
// shell paints instantly while three.js streams in.
const Scene3D = dynamic(() => import("@/components/Scene3D"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="bg-clinical-gradient relative min-h-screen w-full overflow-clip">
      {/* Holographic base + soft blue glow behind the model, under the canvas. */}
      <div className="hero-rings z-0" />
      <div className="hero-glow z-0" />

      {/* Fixed, full-viewport WebGL canvas sitting behind the scroll content. */}
      <Scene3D />

      {/* Scroll-driven copy + the GSAP ScrollTrigger track. */}
      <ScrollSection />
    </main>
  );
}
