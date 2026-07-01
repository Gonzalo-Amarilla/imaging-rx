"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { scrollProgress, smoothstep } from "@/lib/scrollProgress";

export type LabelData = {
  /** Substring used to match the real mesh in the GLB. */
  match: string;
  eyebrow: string;
  title: string;
  /** scroll progress (0..1) at which this label starts to fade in */
  reveal: number;
};

/**
 * One callout per real mesh in the scanner GLB. Each is anchored to the exact
 * center of its corresponding mesh (see Scene3D) so the dot always sits on the
 * right piece.
 */
export const LABELS: LabelData[] = [
  { match: "Stand", eyebrow: "01", title: "Estructura de soporte", reveal: 0.2 },
  { match: "Bed", eyebrow: "02", title: "Camilla del paciente", reveal: 0.42 },
  { match: "Main", eyebrow: "03", title: "Unidad de diagnóstico", reveal: 0.62 },
];

type LabelsProps = {
  /** World-space anchor positions, written every frame by the Model. */
  anchorsRef: React.MutableRefObject<THREE.Vector3[]>;
  /** Mesh refs of the model, used for real depth occlusion of the labels. */
  occludeRef: React.MutableRefObject<{ current: THREE.Object3D }[]>;
};

export default function Labels({ anchorsRef, occludeRef }: LabelsProps) {
  const { camera } = useThree();
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const chipRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Reused across frames to avoid per-frame allocations.
  const raycaster = useRef(new THREE.Raycaster());
  const rayDir = useRef(new THREE.Vector3());

  /**
   * Manual, reliable occlusion: cast a ray from the camera toward a label's
   * anchor and check whether ANY *other* mesh of the model sits in front of it.
   * (We exclude the label's own mesh because the anchor lives at that mesh's
   * center, so its own front face would always intersect first.) This is the
   * authoritative test — we don't lean on drei's <Html occlude> at all.
   */
  function isOccluded(index: number, anchor: THREE.Vector3): boolean {
    const refs = occludeRef.current;
    if (!refs || refs.length === 0) return false;

    rayDir.current.copy(anchor).sub(camera.position);
    const distToAnchor = rayDir.current.length();
    if (distToAnchor < 1e-4) return false;
    rayDir.current.normalize();

    raycaster.current.set(camera.position, rayDir.current);
    // Only count geometry that sits clearly in front of the anchor.
    raycaster.current.far = distToAnchor - 0.15;

    for (let j = 0; j < refs.length; j++) {
      if (j === index) continue; // skip the label's own mesh
      const mesh = refs[j]?.current;
      if (!mesh) continue;
      const hits = raycaster.current.intersectObject(mesh, true);
      if (hits.length > 0) return true;
    }
    return false;
  }

  useFrame(() => {
    const p = scrollProgress.get();
    // Labels fade away with the model at the very end so they don't float.
    const endFade = 1 - smoothstep(0.84, 0.95, p);

    for (let i = 0; i < LABELS.length; i++) {
      const group = groupRefs.current[i];
      const anchor = anchorsRef.current[i];
      if (group && anchor) {
        group.position.copy(anchor);
      }

      const chip = chipRefs.current[i];
      if (!chip || !anchor) continue;

      // Reveal opacity from scroll position...
      let opacity =
        smoothstep(LABELS[i].reveal, LABELS[i].reveal + 0.12, p) * endFade;

      // ...hard-killed to 0 whenever the anchor is hidden behind the model.
      if (opacity > 0 && isOccluded(i, anchor)) opacity = 0;

      chip.style.opacity = opacity.toFixed(3);
      // Subtle slide-in for extra polish.
      chip.style.transform = `translate(-50%, -50%) translateX(${(1 - opacity) * -8}px)`;
    }
  });

  return (
    <>
      {LABELS.map((label, i) => (
        <group
          key={label.title}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
        >
          <Html center zIndexRange={[40, 0]} wrapperClass="pointer-events-none">
            <div
              ref={(el) => {
                chipRefs.current[i] = el;
              }}
              className="label-anchor"
            >
              <span className="label-dot" />
              <span className="label-line" />
              <span className="label-chip">
                <span className="eyebrow">{label.eyebrow}</span>
                <span className="title">{label.title}</span>
              </span>
            </div>
          </Html>
        </group>
      ))}
    </>
  );
}
