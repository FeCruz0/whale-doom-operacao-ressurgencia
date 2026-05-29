"use client";

import { useRef, useMemo } from "react";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore, OilSlickItem } from "@/store/useGameStore";
import { OilSlickMaterial } from "./materials/CustomShaders";

// ─── Deterministic pseudo-random ─────────────────────────────────────────────
function rng(seed: number): number {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

// ─── Deformed flat blob geometry ─────────────────────────────────────────────
// Creates an irregular pancake shape using radial sine noise on a sphere.
// Each blob has a unique waveform determined by `seed`, making every cloud asymmetric.
function makeOilBlobGeometry(
  noiseStrength: number,
  seed: number
): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 22, 14);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    // Polar angle around Y axis
    const angle = Math.atan2(z, x);

    // Multi-octave sine "noise" in XZ plane — fully deterministic, no lib needed
    const n1 = Math.sin(angle * 2.3 + seed * 6.28) * noiseStrength * 0.45;
    const n2 = Math.sin(angle * 3.7 + seed * 2.71) * noiseStrength * 0.30;
    const n3 = Math.cos(angle * 5.1 + seed * 9.42) * noiseStrength * 0.25;
    const noise = n1 + n2 + n3;

    const r = Math.sqrt(x * x + z * z);
    const newR = r + noise;
    pos.setX(i, Math.cos(angle) * newR);
    pos.setZ(i, Math.sin(angle) * newR);

    // Crush Y to get a flat pancake (oil sits near a horizontal plane)
    pos.setY(i, pos.getY(i) * 0.09);
  }

  pos.needsUpdate = true; // Tell Three.js to upload the modified vertices to the GPU
  geo.computeVertexNormals();
  return geo;
}

// ─── Single blob mesh ─────────────────────────────────────────────────────────
function OilBlob({
  position,
  scale,
  opacity,
  baseRotY,
  phase,
  speed,
  geo,
}: {
  position: [number, number, number];
  scale: number;
  opacity: number;
  baseRotY: number;
  phase: number;
  speed: number;
  geo: THREE.BufferGeometry;
}) {
  const ref = useRef<THREE.Mesh>(null);
  
  const mat = useMemo(() => {
    const m = new OilSlickMaterial();
    m.transparent = true;
    m.depthWrite = false;
    m.uOpacity = opacity;
    return m;
  }, [opacity]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    // Organic pulsing scale
    const pulse = 1.0 + Math.sin(t * speed + phase) * 0.07;
    ref.current.scale.set(scale * pulse, 1, scale * pulse);
    // Counter-rotating blobs create a swirling, viscous feeling
    ref.current.rotation.y = baseRotY + t * 0.018 * (phase > Math.PI ? 1 : -1);

    mat.uTime = t;
  });

  return (
    <mesh ref={ref} position={position} geometry={geo} receiveShadow>
      <primitive object={mat} />
    </mesh>
  );
}



// ─── Full organic oil cloud (one OilSlick from the store) ─────────────────────
function OilCloud({ slick }: { slick: OilSlickItem }) {
  // Generate 8 blob configs once per slick, stable across renders
  const blobs = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const angle = rng(slick.id * 13 + i * 7) * Math.PI * 2;
      const dist  = rng(slick.id * 17 + i * 3) * slick.radius * 0.45;
      const scale = slick.radius * (0.42 + rng(slick.id * 5 + i * 11) * 0.58);
      const noiseStr = 0.12 + rng(slick.id * 9 + i) * 0.22;
      const seed     = rng(slick.id + i * 3);

      return {
        position: [
          Math.cos(angle) * dist,
          0,
          Math.sin(angle) * dist,
        ] as [number, number, number],
        scale,
        opacity:  0.52 + rng(slick.id * 3 + i * 9) * 0.32,
        baseRotY: rng(slick.id + i) * Math.PI * 2,
        phase:    rng(slick.id * 7 + i) * Math.PI * 2,
        speed:    0.35 + rng(slick.id * 11 + i * 5) * 0.55,
        geo:      makeOilBlobGeometry(noiseStr, seed),
      };
    });
  }, [slick.id, slick.radius]);

  return (
    <group position={slick.position}>
      {/* Eerie toxic green point light — makes nearby geometry tinted */}
      <pointLight
        color="#1e4a08"
        intensity={2.8}
        distance={slick.radius * 1.8}
        decay={2}
      />
      {/* Secondary dark amber shimmer for iridescent oil effect */}
      <pointLight
        color="#3d2800"
        intensity={1.2}
        distance={slick.radius * 1.2}
        decay={2.5}
      />
      {blobs.map((b, i) => (
        <OilBlob key={i} {...b} />
      ))}
    </group>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────
export function OilSlicks() {
  const oilSlicks = useGameStore((state) => state.oilSlicks);

  return (
    <>
      {oilSlicks.map((slick: OilSlickItem) => (
        <OilCloud key={slick.id} slick={slick} />
      ))}

    </>
  );
}
