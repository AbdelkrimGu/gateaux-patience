"use client";

// Interactive 3D preview of the customer's actual box.
//
// Photoreal-by-construction: procedural shape-aware cake body, cocoa top baked
// from the real photo + shared layout, cream sides, a ceramic plate, image-based
// lighting from in-scene Lightformers (NO network HDRI), one shadow-casting key
// light, ACES tone mapping and a soft contact shadow grounding the cake.
//
// White-chocolate pieces are real raised geometry (the actual letter photos on
// glossy material) casting real soft shadows; cacao writing is baked flat into
// the cocoa texture (physically correct — it's pressed into the surface).
//
// Rendered only through TiramisuPreview via next/dynamic({ ssr:false }).

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import {
  computeLayout,
  SETS,
  SHAPES_CFG,
  S,
  type ShapeKey,
} from "@/lib/tiramisu-layout";
import type { TiramisuStyle } from "@/lib/tiramisu-config";
import { buildCakeGeometry } from "./geometry";
import { useTopTexture, useLetterTextures } from "./useTiramisuTextures";

export type ViewKey = "hero" | "top" | "side";

// Spherical camera presets: theta (azimuth), phi (polar from +Y), radius.
const VIEWS: Record<ViewKey, { theta: number; phi: number; radius: number }> = {
  hero: { theta: 0.55, phi: 0.92, radius: 4.4 },
  top: { theta: 0.0, phi: 0.22, radius: 4.1 },
  side: { theta: 0.0, phi: 1.4, radius: 4.7 },
};

const CAKE_H = 0.34; // cake thickness
const LETTER_LIFT = 0.03; // white-chocolate letters stand proud of the cocoa

interface SceneProps {
  style: TiramisuStyle;
  fontScale: number;
  text: string;
  shape: ShapeKey;
  reducedMotion: boolean;
  /** Preset request from the toolbar: bump nonce to (re)trigger. */
  view: { key: ViewKey; nonce: number };
  frameloop: "always" | "never";
  lowPower: boolean;
}

// ------- the cake itself -------
function Cake({ style, fontScale, text, shape, reducedMotion }: {
  style: TiramisuStyle;
  fontScale: number;
  text: string;
  shape: ShapeKey;
  reducedMotion: boolean;
}) {
  const { geo, bb, topZ } = useMemo(() => buildCakeGeometry(shape, CAKE_H), [shape]);
  useEffect(() => () => geo.dispose(), [geo]);

  const topTex = useTopTexture(style, fontScale, text, shape);

  // Materials (created once; disposed on unmount).
  const cocoaMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#4a2f1c", roughness: 0.97, metalness: 0 }),
    []
  );
  const creamMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ecdcc0", roughness: 0.86, metalness: 0 }),
    []
  );
  useEffect(
    () => () => {
      cocoaMat.dispose();
      creamMat.dispose();
    },
    [cocoaMat, creamMat]
  );

  // Keep the cocoa albedo in sync with the debounced baked texture.
  useEffect(() => {
    cocoaMat.map = topTex;
    cocoaMat.needsUpdate = true;
  }, [cocoaMat, topTex]);

  // White-chocolate letters: real geometry, shared layout.
  const glyphs = useMemo(() => {
    if (style !== "pieces" || !text) return [];
    return computeLayout(text, SETS.pieces, fontScale, SHAPES_CFG[shape]).glyphs;
  }, [style, text, fontScale, shape]);
  const letterTex = useLetterTextures(glyphs, style);

  // Gentle cinematic settle/lift-in.
  const group = useRef<THREE.Group>(null);
  const t0 = useRef<number | null>(null);
  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    if (reducedMotion) {
      g.scale.setScalar(1);
      g.position.y = 0;
      return;
    }
    if (t0.current === null) t0.current = state.clock.elapsedTime;
    const p = Math.min(1, (state.clock.elapsedTime - t0.current) / 1.1);
    const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
    g.scale.setScalar(0.92 + 0.08 * e);
    g.position.y = (1 - e) * 0.14;
  });

  return (
    <group ref={group}>
      {/* Cake body: top cap = cocoa, walls = cream. */}
      <mesh
        geometry={geo}
        material={[cocoaMat, creamMat]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      />

      {/* White-chocolate letters — raised, glossy, casting real shadows. */}
      {glyphs.map((gl, i) => {
        const tex = letterTex[gl.ch];
        if (!tex) return null;
        const wx = (gl.w / S) * bb.w;
        const hz = (gl.h / S) * bb.h;
        const x = bb.minX + (gl.x / S) * bb.w;
        const z = -(bb.minY + (gl.y / S) * bb.h);
        return (
          <group key={i} position={[x, topZ + LETTER_LIFT, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh rotation={[0, 0, gl.angle]} scale={[wx, hz, 1]} castShadow>
              <planeGeometry args={[1, 1]} />
              <meshPhysicalMaterial
                map={tex}
                color="#fff6e8"
                roughness={0.34}
                metalness={0}
                clearcoat={0.7}
                clearcoatRoughness={0.28}
                transparent
                alphaTest={0.5}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ------- camera rig: preset transitions, constrained -------
function Rig({
  view,
  animating,
}: {
  view: { key: ViewKey; nonce: number };
  animating: React.MutableRefObject<boolean>;
}) {
  const controls = useThree((s) => s.controls) as any;
  const camera = useThree((s) => s.camera);
  const target = useRef<{ theta: number; phi: number; radius: number } | null>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (view.nonce > 0) {
      target.current = VIEWS[view.key];
      animating.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.nonce]);

  useFrame((_, dt) => {
    if (!controls || !target.current) return;
    const t = target.current;
    const l = 1 - Math.exp(-6 * dt);
    const az = controls.getAzimuthalAngle();
    const pol = controls.getPolarAngle();
    const r = camera.position.distanceTo(controls.target);
    const naz = az + (t.theta - az) * l;
    const npol = pol + (t.phi - pol) * l;
    const nr = r + (t.radius - r) * l;
    controls.setAzimuthalAngle(naz);
    controls.setPolarAngle(npol);
    tmp.copy(camera.position).sub(controls.target).setLength(nr);
    camera.position.copy(controls.target).add(tmp);
    controls.update();
    if (
      Math.abs(t.theta - naz) < 0.002 &&
      Math.abs(t.phi - npol) < 0.002 &&
      Math.abs(t.radius - nr) < 0.01
    ) {
      target.current = null;
      animating.current = false;
    }
  });
  return null;
}

// ------- controls with idle auto-rotate that pauses on touch -------
function Controls({
  reducedMotion,
  animating,
}: {
  reducedMotion: boolean;
  animating: React.MutableRefObject<boolean>;
}) {
  const ref = useRef<any>(null);
  const spinRef = useRef(!reducedMotion);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onStart = () => {
    spinRef.current = false;
    if (idleTimer.current) clearTimeout(idleTimer.current);
  };
  const onEnd = () => {
    if (reducedMotion) return;
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      spinRef.current = true;
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  useFrame(() => {
    const c = ref.current;
    if (!c) return;
    c.autoRotate = spinRef.current && !animating.current && !reducedMotion;
  });

  return (
    <OrbitControls
      ref={ref}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={2.8}
      maxDistance={7}
      minPolarAngle={0.18}
      maxPolarAngle={1.45}
      autoRotateSpeed={0.7}
      target={[0, CAKE_H * 0.5, 0]}
      onStart={onStart}
      onEnd={onEnd}
    />
  );
}

export default function TiramisuScene3D({
  style,
  fontScale,
  text,
  shape,
  reducedMotion,
  view,
  frameloop,
  lowPower,
}: SceneProps) {
  const animating = useRef(false);
  const shadowSize = lowPower ? 512 : 1024;

  return (
    <Canvas
      frameloop={frameloop}
      shadows
      dpr={[1, lowPower ? 1.5 : 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      camera={{ fov: 35, position: [2.4, 2.9, 3.0], near: 0.1, far: 50 }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[3.2, 6, 3.4]}
        intensity={2.3}
        castShadow
        shadow-mapSize-width={shadowSize}
        shadow-mapSize-height={shadowSize}
        shadow-bias={-0.0004}
        shadow-radius={5}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />

      {/* Image-based lighting — built in-scene, no external HDRI fetch. */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={["#2a1c12"]} />
        <Lightformer intensity={2.2} position={[0, 4, -3]} scale={[9, 5, 1]} color="#fff4e6" />
        <Lightformer intensity={1.3} position={[-4, 2, 2]} scale={[4, 5, 1]} color="#ffe9d0" />
        <Lightformer intensity={0.9} position={[4, 3, 3]} scale={[4, 4, 1]} color="#ffffff" />
        <Lightformer
          intensity={1.4}
          position={[0, -3, 0]}
          scale={[10, 10, 1]}
          rotation={[Math.PI / 2, 0, 0]}
          color="#3a2a20"
        />
      </Environment>

      <Cake
        style={style}
        fontScale={fontScale}
        text={text}
        shape={shape}
        reducedMotion={reducedMotion}
      />

      {/* Ceramic plate grounding the cake. */}
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <cylinderGeometry args={[2.0, 2.05, 0.08, 64]} />
        <meshPhysicalMaterial color="#f2ece3" roughness={0.3} clearcoat={0.4} clearcoatRoughness={0.4} />
      </mesh>

      <ContactShadows
        position={[0, 0.03, 0]}
        opacity={0.5}
        blur={2.6}
        far={4}
        scale={6}
        resolution={512}
        color="#2a160a"
      />

      <Controls reducedMotion={reducedMotion} animating={animating} />
      <Rig view={view} animating={animating} />
    </Canvas>
  );
}
