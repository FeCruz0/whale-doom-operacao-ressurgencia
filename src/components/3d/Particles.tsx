"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";

export function Particles({ count = 800 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const isPlaying = useGameStore((state) => state.isPlaying);
  const isPaused = useGameStore((state) => state.isPaused);

  // Generate random positions for the particles
  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Spread particles in a box around the tunnel
      pos[i * 3] = (Math.random() - 0.5) * 150; // X
      pos[i * 3 + 1] = (Math.random() - 0.5) * 150; // Y
      pos[i * 3 + 2] = -Math.random() * 500; // Z (spread far ahead)
      
      spd[i] = 10 + Math.random() * 30; // Random speed factor
    }
    return [pos, spd];
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    // Only move particles forward if the game is playing and not paused
    const currentSpeed = isPlaying && !isPaused ? 40 : 5;
    
    const positionsAttr = pointsRef.current.geometry.attributes.position;
    const array = positionsAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const idxZ = i * 3 + 2;
      // Move particle towards the screen (positive Z direction)
      array[idxZ] += currentSpeed * delta * (speeds[i] / 15);

      // If the particle passes behind the camera, reset it far back
      if (array[idxZ] > 30) {
        array[idxZ] = -500;
        // Also randomize X and Y slightly to vary the tunnel
        array[i * 3] = (Math.random() - 0.5) * 150;
        array[i * 3 + 1] = (Math.random() - 0.5) * 150;
      }
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
        color="#06b6d4" // Cyberpunk Cyan
        size={0.6}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
