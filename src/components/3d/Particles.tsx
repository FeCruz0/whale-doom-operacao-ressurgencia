"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";

export function Particles({ count = 400 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const isPaused = useGameStore((state) => state.isPaused);

  // Generate random static positions and drift speeds for water bubbles / plankton
  const [positions, offsets] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const offs = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 160; // X
      pos[i * 3 + 1] = (Math.random() - 0.5) * 100; // Y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 240 - 50; // Z
      
      offs[i] = Math.random() * Math.PI * 2; // Random sin phase offset
    }
    return [pos, offs];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current || isPaused) return;
    
    const positionsAttr = pointsRef.current.geometry.attributes.position;
    const array = positionsAttr.array as Float32Array;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const idxX = i * 3;
      const idxY = i * 3 + 1;
      const idxZ = i * 3 + 2;

      // Drift slightly in a sinuous current wave
      array[idxY] += Math.sin(time * 0.5 + offsets[i]) * 0.015;
      array[idxX] += Math.cos(time * 0.3 + offsets[i]) * 0.01;
      array[idxZ] += Math.sin(time * 0.2 + offsets[i]) * 0.01;
    }

    positionsAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#22d3ee" // Cyberpunk Cyan
        size={0.4}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
