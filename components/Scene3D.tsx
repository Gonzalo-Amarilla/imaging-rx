"use client";

import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, ContactShadows } from "@react-three/drei";
import { scrollProgress, smoothstep } from "@/lib/scrollProgress";
import Labels, { LABELS } from "./Labels";
import Loader from "./Loader";

const MODEL_URL = "/models/ct_scanner.glb";

// Tuning constants for the cinematic feel.
const TARGET_SIZE = 3.2; // model is auto-fit to roughly this many world units
const FADE_START = 0.86; // model dissolves at the end to clear the closing copy
const FADE_END = 0.97;

// --- Model "pendulum" rotation ---------------------------------------------
// The model gently sways left<->right around BASE_YAW and is bounded so it
// never rotates far enough to expose its back. This is the ONLY thing that
// turns the model — the camera handles the per-part zoom (see CameraRig).
//
// We can't visually detect which face is the "nice" front, so BASE_YAW points
// it at the camera: 0 = the model's native front. If the back ends up facing
// us, set this to Math.PI (180°); for a quarter turn use ±Math.PI / 2.
const BASE_YAW = 0;
const IDLE_SWAY_ANGLE = THREE.MathUtils.degToRad(52); // wide, since the back is small
const IDLE_SWAY_SPEED = 0.34; // rad/s — lower = slower, calmer sway
const EXPLODE_YAW = THREE.MathUtils.degToRad(10); // tiny extra turn while exploding

// --- Exploded view: a clean VERTICAL separation ----------------------------
// Pieces fan apart purely along Y, ranked by their real height: the topmost
// piece rises, the bottom one drops, the middle one holds near the center.
// Because each piece keeps its vertical order and only moves on one axis, they
// never pass through one another. Each piece also has its own scroll window so
// they peel away one at a time and read clearly.
const VERTICAL_SLOT = 0.5; // gap between adjacent vertical slots (fraction of size)
const PART_WINDOWS: Record<string, [number, number]> = {
  Stand: [0.1, 0.36],
  Bed: [0.34, 0.6],
  Main: [0.5, 0.76],
};
const DEFAULT_WINDOW: [number, number] = [0.1, 0.7];
// Per-part fine-tuning of how far a piece travels (1 = full slot distance).
const DIST_SCALE: Record<string, number> = {
  Stand: 0.55, // support structure drops, but not as much as the others
};

type Part = {
  mesh: THREE.Mesh;
  basePos: THREE.Vector3;
  geomCenter: THREE.Vector3; // center in the mesh's own geometry space (constant)
  centerY: number; // assembled world-height, used to rank the vertical slots
  match?: string; // which LABEL this piece matched (for per-part tuning)
  dir: THREE.Vector3; // explode direction (always +Y here)
  dist: number; // signed travel distance in local units (+up / -down)
  win: [number, number]; // scroll window for this part's separation
};

function Model({
  anchorsRef,
  meshRefs,
}: {
  anchorsRef: React.MutableRefObject<THREE.Vector3[]>;
  meshRefs: React.MutableRefObject<{ current: THREE.Object3D }[]>;
}) {
  // `true` → decode with Draco (the model geometry is Draco-compressed).
  const { scene } = useGLTF(MODEL_URL, true);
  const spinRef = useRef<THREE.Group>(null);

  // Process the model once: clone (Strict-Mode / cache safe), flatten the mesh
  // hierarchy into a single space, and order parts to match the labels.
  const { root, fitScale, fitOffset, parts, materials } = useMemo(() => {
    const root = scene.clone(true);
    root.updateWorldMatrix(true, true);

    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    // Re-parent every mesh directly under the root so they all share one
    // coordinate space — makes independent translation trivial.
    const meshes: THREE.Mesh[] = [];
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });
    meshes.forEach((m) => root.attach(m));
    root.updateWorldMatrix(true, true);

    const buildPart = (mesh: THREE.Mesh, win: [number, number]): Part => {
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      const geomCenter = mesh.geometry
        .boundingBox!.getCenter(new THREE.Vector3());
      const centerY = geomCenter.clone().applyMatrix4(mesh.matrixWorld).y;
      return {
        mesh,
        basePos: mesh.position.clone(),
        geomCenter,
        centerY,
        dir: new THREE.Vector3(0, 1, 0),
        dist: 0,
        win,
      };
    };

    // Order parts to align 1:1 with LABELS (by mesh name), so anchors and
    // callout texts always refer to the same physical piece.
    const parts: Part[] = [];
    for (const label of LABELS) {
      const mesh = meshes.find((m) =>
        m.name.toLowerCase().includes(label.match.toLowerCase()),
      );
      if (mesh) {
        const part = buildPart(mesh, PART_WINDOWS[label.match] ?? DEFAULT_WINDOW);
        part.match = label.match;
        parts.push(part);
      }
    }
    // Include any meshes that weren't matched so they still separate.
    for (const mesh of meshes) {
      if (!parts.some((p) => p.mesh === mesh)) {
        parts.push(buildPart(mesh, DEFAULT_WINDOW));
      }
    }

    // Rank parts by real height and assign a vertical slot: the topmost rises,
    // the bottom drops, the middle holds — so they fan apart along Y without
    // ever crossing through each other.
    const ranked = [...parts].sort((a, b) => a.centerY - b.centerY);
    const mid = (ranked.length - 1) / 2;
    ranked.forEach((part, rank) => {
      const scale = part.match ? (DIST_SCALE[part.match] ?? 1) : 1;
      part.dist = (rank - mid) * VERTICAL_SLOT * maxDim * scale;
    });

    // Unique materials, for the end-of-scroll dissolve.
    const materials = new Set<THREE.Material>();
    meshes.forEach((m) => {
      (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) =>
        materials.add(mat),
      );
    });

    const fitScale = TARGET_SIZE / maxDim;
    const fitOffset = center.clone().multiplyScalar(-1);

    return { root, fitScale, fitOffset, parts, materials: [...materials] };
  }, [scene]);

  // Expose the matched meshes (first LABELS.length parts) for label occlusion.
  meshRefs.current = parts
    .slice(0, LABELS.length)
    .map((p) => ({ current: p.mesh as THREE.Object3D }));

  useFrame((state) => {
    const p = scrollProgress.get();
    // Overall disassembly amount (used only for tilt / yaw / calming the sway).
    const explodeT = smoothstep(0.1, 0.8, p);

    // Slow, bounded pendulum: the model sways right, and before it would reveal
    // its back it eases the other way — wide at first, then calming down as the
    // parts separate so the per-part zoom stays steady. Time-based so it keeps
    // swaying gently even while idle.
    if (spinRef.current) {
      const amp = IDLE_SWAY_ANGLE * (1 - 0.55 * explodeT);
      const sway = Math.sin(state.clock.elapsedTime * IDLE_SWAY_SPEED) * amp;
      spinRef.current.rotation.y = BASE_YAW + sway + explodeT * EXPLODE_YAW;
      // Slight tilt forward as it disassembles, for drama.
      spinRef.current.rotation.x = explodeT * 0.08;
    }

    // Separate each part inside its OWN scroll window, eased — so pieces peel
    // away one at a time and travel a controlled distance instead of flying off.
    for (const part of parts) {
      const sep = smoothstep(part.win[0], part.win[1], p);
      part.mesh.position
        .copy(part.basePos)
        .addScaledVector(part.dir, part.dist * sep);
    }

    // Dissolve the whole rig at the very end so it doesn't fight the closing copy.
    const fade = 1 - smoothstep(FADE_START, FADE_END, p);
    const fading = fade < 0.999;
    for (const mat of materials) {
      mat.transparent = fading;
      mat.opacity = fade;
      mat.depthWrite = !fading;
    }

    // Glue each label anchor to the exact (moving) center of its mesh, in world.
    root.updateWorldMatrix(true, false);
    for (let i = 0; i < LABELS.length && i < parts.length; i++) {
      const part = parts[i];
      const v = anchorsRef.current[i] ?? new THREE.Vector3();
      v.copy(part.geomCenter).applyMatrix4(part.mesh.matrixWorld);
      anchorsRef.current[i] = v;
    }
  });

  return (
    <group ref={spinRef}>
      <group scale={fitScale} position={fitOffset.clone().multiplyScalar(fitScale)}>
        <primitive object={root} />
      </group>
    </group>
  );
}

/**
 * Cinematic camera that "visits" each part as it separates. It pans its look-at
 * target onto the active piece and dollies in to frame it (a soft zoom), then
 * pulls back at the end to reveal the whole exploded assembly. It only ever
 * translates — never orbits — so the model's back is never exposed.
 *
 * Keyframes: [scrollProgress, anchorIndex (-1 = model center), radius, height].
 */
const CAM_KEYS: [number, number, number, number][] = [
  [0.05, -1, 6.6, 0.4], // assembled, wide establishing shot
  [0.26, 0, 4.3, 0.7], // zoom: Estructura de soporte (rises)
  [0.5, 1, 4.3, 0.55], // zoom: Camilla del paciente (drops)
  [0.68, 2, 4.7, 0.8], // zoom: Unidad de diagnóstico (the core)
  [0.86, -1, 7.2, 1.0], // pull back: whole vertical exploded view
];

function CameraRig({
  anchorsRef,
}: {
  anchorsRef: React.MutableRefObject<THREE.Vector3[]>;
}) {
  const { camera } = useThree();
  const dest = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const a = useRef(new THREE.Vector3());
  const b = useRef(new THREE.Vector3());

  const resolve = (index: number, out: THREE.Vector3) => {
    if (index < 0) return out.set(0, 0, 0); // model center (rig is at origin)
    const anchor = anchorsRef.current[index];
    return anchor ? out.copy(anchor) : out.set(0, 0, 0);
  };

  useFrame(() => {
    const p = scrollProgress.get();

    // Find the keyframe segment containing p.
    let i = 0;
    while (i < CAM_KEYS.length - 2 && p > CAM_KEYS[i + 1][0]) i++;
    const ka = CAM_KEYS[i];
    const kb = CAM_KEYS[i + 1];
    const lt = smoothstep(ka[0], kb[0], p); // eased 0..1 across the segment

    // Interpolated look-at target (pans from one part to the next).
    resolve(ka[1], a.current);
    resolve(kb[1], b.current);
    look.current.lerpVectors(a.current, b.current, lt);

    const radius = THREE.MathUtils.lerp(ka[2], kb[2], lt);
    const height = THREE.MathUtils.lerp(ka[3], kb[3], lt);

    // Camera sits in front of the target and slightly above it.
    dest.current.set(
      look.current.x,
      look.current.y + height,
      look.current.z + radius,
    );
    camera.position.lerp(dest.current, 0.05); // heavy, smooth follow
    camera.lookAt(look.current);
  });

  return null;
}

export default function Scene3D() {
  const anchorsRef = useRef<THREE.Vector3[]>(
    LABELS.map(() => new THREE.Vector3()),
  );
  const meshRefs = useRef<{ current: THREE.Object3D }[]>([]);

  return (
    <Canvas
      className="!fixed inset-0 z-[1]"
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.5, 6], fov: 38, near: 0.1, far: 100 }}
    >
      {/* Premium clinical lighting: soft key, cool fill, plus rim/back lights so
          the model keeps volume and detail from every scroll angle. */}
      <hemisphereLight args={["#ffffff", "#cfe0ff", 0.85]} />
      <directionalLight position={[4, 6, 4]} intensity={2.0} castShadow />
      <directionalLight position={[-5, 3, 2]} intensity={0.55} color="#bcd4ff" />
      {/* Rim / back lights — wrap the silhouette so the rear never looks flat. */}
      <directionalLight position={[-4, 3.5, -5]} intensity={1.1} color="#eaf2ff" />
      <directionalLight position={[5, 4, -4]} intensity={1.0} color="#ffffff" />
      <directionalLight position={[0, -1, -6]} intensity={0.45} color="#dbe8ff" />

      <Suspense fallback={<Loader />}>
        <Model anchorsRef={anchorsRef} meshRefs={meshRefs} />
        <Labels anchorsRef={anchorsRef} occludeRef={meshRefs} />
        <ContactShadows
          position={[0, -1.7, 0]}
          opacity={0.32}
          scale={12}
          blur={2.6}
          far={4}
          color="#0a2463"
        />
      </Suspense>

      <CameraRig anchorsRef={anchorsRef} />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL, true);
