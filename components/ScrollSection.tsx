"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollProgress } from "@/lib/scrollProgress";

/**
 * Owns the scrollable track and scrubs a 0..1 progress value to scroll position
 * via GSAP ScrollTrigger. `scrub: 1` adds ~1s of catch-up smoothing so the
 * scroll feels heavy and cinematic rather than 1:1.
 *
 * Visual styling follows the Imaging Rx design system (Plus Jakarta Sans, navy
 * #0c1b33 + brand blue #1a5fe0): a filled hero with floating cards flanking the
 * 3D model. Everything fades out on scroll to reveal the clean exploded view.
 * Overlay opacity is driven imperatively to avoid per-frame React re-renders.
 */

// Floating feature callouts on the left of the model (design images 3 & 4).
const LEFT_CARDS: { icon: JSX.Element; title: string; desc: string }[] = [
  {
    icon: <IconCube />,
    title: "Tubos de reemplazo",
    desc: "Alta calidad y máximo desempeño.",
  },
  {
    icon: <IconShield />,
    title: "Compatibilidad garantizada",
    desc: "Multimarca y múltiples modelos.",
  },
  {
    icon: <IconHeadset />,
    title: "Soporte técnico especializado",
    desc: "Asesoría experta y respuesta ágil.",
  },
];

// Equipment categories on the right of the model (design image 4).
const RIGHT_CARDS: string[] = [
  "Sistemas de rayos X",
  "Tomografía",
  "Arcos en C",
  "Angiografía",
  "Mamografía con IA",
];

// Connector lengths (px) per card, so the end dots trace the round gantry: the
// middle cards sit closest to the widest part of the model (shorter lines).
const LEFT_LINE = [58, 38, 58];
const RIGHT_LINE = [64, 50, 42, 50, 64];

// Compact trust badges shown under the title on tablet / mobile.
const TRUST = ["Tecnología confiable", "Rendimiento comprobado", "Soporte especializado"];

export default function ScrollSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const proxy = { v: 0 };
      gsap.to(proxy, {
        v: 1,
        ease: "none",
        scrollTrigger: {
          trigger: trackRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
        onUpdate: () => {
          const p = proxy.v;
          scrollProgress.set(p);

          // Whole hero (title + side cards) fades out as the model takes over.
          if (heroRef.current) {
            const o = 1 - smoothstep(0.02, 0.14, p);
            heroRef.current.style.opacity = o.toFixed(3);
            heroRef.current.style.transform = `translateY(${(1 - o) * -20}px)`;
          }
          if (hintRef.current) {
            hintRef.current.style.opacity = (1 - smoothstep(0.0, 0.1, p)).toFixed(3);
          }
          // Closing copy fades in WHILE the model is still dissolving
          // (model fade ≈ 0.86→0.97), so the two cross-fade continuously.
          if (closingRef.current) {
            const o = smoothstep(0.82, 0.96, p);
            closingRef.current.style.opacity = o.toFixed(3);
            closingRef.current.style.transform = `translateY(${(1 - o) * 24}px)`;
          }
        },
      });
    });

    const t = setTimeout(() => ScrollTrigger.refresh(), 200);

    return () => {
      clearTimeout(t);
      ctx.revert();
    };
  }, []);

  return (
    <div className="relative z-10">
      {/* ===== HEADER (Imaging Rx design system) ===== */}
      <header className="fixed inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-[1640px] items-center justify-between gap-6 px-6 py-5 sm:px-12">
          {/* logo */}
          <a href="#" className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2.5">
            <span className="text-[18px] font-extrabold italic tracking-[-1px] text-ink sm:text-[22px] md:text-[25px] md:tracking-[-1.2px]">
              IMAGING
            </span>
            <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8 flex-shrink-0 sm:h-10 sm:w-10 md:h-11 md:w-11">
              <circle cx="24" cy="24" r="20" fill="#ffffff" stroke="#0c1b33" strokeWidth="2.4" />
              <path
                d="M24 4.5 L24 9 M24 39 L24 43.5 M4.5 24 L9 24 M39 24 L43.5 24"
                stroke="#1a5fe0"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <text
                x="24"
                y="29.5"
                textAnchor="middle"
                fontFamily="'Plus Jakarta Sans',sans-serif"
                fontSize="15"
                fontWeight="800"
                fontStyle="italic"
                fill="#0c1b33"
              >
                RX
              </text>
            </svg>
            <span className="text-[18px] font-extrabold italic tracking-[-0.5px] text-ink sm:text-[22px] md:text-[25px]">
              S.A.S.
            </span>
          </a>

          {/* nav */}
          <nav className="hidden items-center gap-[34px] xl:flex">
            <a
              href="#"
              className="border-b-2 border-clinical pb-1 text-[15.5px] font-bold text-clinical"
            >
              Inicio
            </a>
            {["Tubos RX", "Equipos", "Servicios", "IA BrAIn", "Cobertura", "Contacto"].map(
              (item) => (
                <a
                  key={item}
                  href="#"
                  className="text-[15.5px] font-medium text-slate transition-colors hover:text-ink"
                >
                  {item}
                </a>
              ),
            )}
          </nav>

          {/* cta */}
          <a
            href="#"
            className="flex flex-shrink-0 items-center gap-2 rounded-full bg-clinical px-5 py-3 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(26,95,224,.28)] transition-transform hover:scale-[1.03]"
          >
            <IconWhatsapp />
            <span className="hidden sm:inline">Cotizar por WhatsApp</span>
            <span className="sm:hidden">Cotizar</span>
          </a>
        </div>
      </header>

      {/* ===== Scroll track the experience is scrubbed across ===== */}
      <section ref={trackRef} className="relative h-[800vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* Hero layer: title + flanking cards. Fades out on scroll. */}
          <div
            ref={heroRef}
            className="pointer-events-none absolute inset-0 will-change-transform"
          >
            {/* Title (eyebrow + h1) — top center, no description. */}
            <div
              className="absolute inset-x-0 top-0 flex flex-col items-center px-6 text-center"
              style={{ paddingTop: "clamp(78px, 8vh, 112px)" }}
            >
              <div
                className="mb-3.5 uppercase text-accent"
                style={{ fontSize: 13, fontWeight: 700, letterSpacing: "3.2px" }}
              >
                Tecnología de imagen médica
              </div>
              <h1
                className="text-balance text-ink"
                style={{
                  fontSize: "clamp(29px, 3.5vw, 56px)",
                  lineHeight: 1,
                  fontWeight: 800,
                  letterSpacing: "-1.4px",
                  maxWidth: "15ch",
                }}
              >
                Tecnología que se explica sola
              </h1>

              {/* Trust badges — fill the space on tablet/mobile where the side
                  columns are hidden. */}
              <div className="mt-8 flex flex-wrap justify-center gap-2.5 lg:hidden">
                {TRUST.map((t) => (
                  <span key={t} className="trust-badge">
                    <IconCheck />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Left column — floating feature callouts, anchored with a line. */}
            <div className="absolute left-4 top-1/2 hidden w-[258px] -translate-y-1/2 flex-col gap-4 lg:flex xl:left-10 xl:w-[300px]">
              {LEFT_CARDS.map((card, i) => (
                <div key={card.title} className="feature-card flex items-start gap-3.5">
                  <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-[rgba(26,95,224,0.1)] text-clinical">
                    {card.icon}
                  </span>
                  <div>
                    <div className="text-[15px] font-bold leading-tight text-ink">
                      {card.title}
                    </div>
                    <div className="mt-1 text-[13px] font-medium leading-snug text-muted">
                      {card.desc}
                    </div>
                  </div>
                  <span className="card-connector right" style={{ width: LEFT_LINE[i] }} />
                </div>
              ))}
            </div>

            {/* Right column — equipment categories with arrow, anchored too. */}
            <div className="absolute right-4 top-1/2 hidden w-[250px] -translate-y-1/2 flex-col gap-3 lg:flex xl:right-10 xl:w-[290px]">
              {RIGHT_CARDS.map((title, i) => (
                <div key={title} className="feature-card flex items-center gap-3">
                  <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-[rgba(26,95,224,0.08)] text-clinical">
                    <IconScan />
                  </span>
                  <span className="flex-1 text-[14.5px] font-bold text-ink">{title}</span>
                  <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-clinical text-white">
                    <IconArrow />
                  </span>
                  <span className="card-connector left" style={{ width: RIGHT_LINE[i] }} />
                </div>
              ))}
            </div>
          </div>

          {/* Scroll indicator — bottom center. */}
          <div
            ref={hintRef}
            className="pointer-events-none absolute inset-x-0 bottom-[30px] flex flex-col items-center gap-[14px]"
          >
            <span
              className="uppercase text-faint"
              style={{ fontSize: 12, fontWeight: 700, letterSpacing: "5px" }}
            >
              Scroll
            </span>
            <span className="relative block h-[46px] w-[2px] overflow-hidden rounded-[2px] bg-[#c2cde0]">
              <span
                className="absolute inset-0 block bg-clinical"
                style={{ animation: "scrollPulse 2.1s ease-in-out infinite" }}
              />
            </span>
          </div>

          {/* Closing copy — centered, cross-fades in as the model dissolves. */}
          <div
            ref={closingRef}
            className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 will-change-transform"
            style={{ opacity: 0 }}
          >
            <div className="mx-auto max-w-2xl text-center">
              <div
                className="mb-4 uppercase text-accent"
                style={{ fontSize: 14, fontWeight: 700, letterSpacing: "3.5px" }}
              >
                Ingeniería de precisión
              </div>
              <h2
                className="text-ink"
                style={{
                  fontSize: "clamp(32px, 3.4vw, 52px)",
                  lineHeight: 1.05,
                  fontWeight: 800,
                  letterSpacing: "-1.2px",
                }}
              >
                Cada componente, una decisión de ingeniería.
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-[17px] font-medium leading-relaxed text-muted">
                Detección de alta resolución, control preciso y una estructura
                pensada para tu flujo clínico. Todo en un solo equipo.
              </p>
              <a
                href="#"
                className="pointer-events-auto mt-9 inline-flex items-center gap-2 rounded-full bg-clinical px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(26,95,224,.28)] transition-transform hover:scale-[1.03]"
              >
                <IconWhatsapp />
                Cotizar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Local copy of smoothstep to keep this component self-contained. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/* ---------------------------------------------------------------- icons -- */

function IconWhatsapp() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="#fff" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.03c-.24.68-1.42 1.31-1.96 1.36-.5.05-1.13.07-1.83-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.93-4.36-.14-.19-1.18-1.57-1.18-2.99s.75-2.12 1.01-2.41c.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.59.83 2.03.9 2.18.07.14.12.31.02.5-.09.19-.14.31-.28.47-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.21 1.36.27.14.43.12.59-.07.16-.19.68-.79.86-1.07.18-.27.36-.22.61-.13.24.09 1.55.73 1.81.86.27.13.45.2.51.31.07.11.07.64-.17 1.31z" />
    </svg>
  );
}

function IconCube() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 20 6.5V17.5L12 22 4 17.5V6.5L12 2Z" />
      <path d="M4 6.5 12 11l8-4.5M12 11v11" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 5 6v5c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6l-7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconHeadset() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13a8 8 0 0 1 16 0" />
      <rect x="3" y="13" width="4" height="6" rx="1.2" />
      <rect x="17" y="13" width="4" height="6" rx="1.2" />
      <path d="M20 19a3 3 0 0 1-3 3h-2" />
    </svg>
  );
}

function IconScan() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
      <path d="M7 12h10" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-clinical" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
