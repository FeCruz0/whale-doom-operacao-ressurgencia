"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending } from "three";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";
import { playerPositionRef } from "./FPSControls";

export function Particles({ count = 10000 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const isPaused = useGameStore((state) => state.isPaused);
  const currentSection = useGameStore((state) => state.currentSection);

  // Pool of particles distributed symmetrically along the Z corridor (Z: 30 to -2000)
  const [positions, phases, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const phs = new Float32Array(count);
    const cols = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      // Distribute evenly along the whole 2000m corridor
      const z = 30 - Math.random() * 2030;
      const slopeY = -35 + (-z * 0.22);
      
      pos[idx] = (Math.random() - 0.5) * 180; // X scatter
      pos[idx + 1] = slopeY + (Math.random() - 0.5) * 80; // Y centered on seabed
      pos[idx + 2] = z; // Z

      phs[i] = Math.random() * Math.PI * 2;

      // Color defaults
      cols[idx] = 0.13; // R
      cols[idx + 1] = 0.82; // G
      cols[idx + 2] = 0.93; // B
    }
    return [pos, phs, cols];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current || isPaused) return;

    const points = pointsRef.current;
    const positionsAttr = points.geometry.attributes.position;
    const colorsAttr = points.geometry.attributes.color;
    const posArr = positionsAttr.array as Float32Array;
    const colArr = colorsAttr.array as Float32Array;
    const time = state.clock.getElapsedTime();
    const playerZ = playerPositionRef.current.z;

    // Define colors dynamically depending on the ocean section
    // Section 1: Clean Cyan, Section 2: Murky Oil Grey/Orange, Section 3: Biolum Purple, Section 4: Golden Glow
    const secColor = {
      r: 0.13, g: 0.82, b: 0.93 // Cyan default
    };

    if (currentSection === 2) {
      secColor.r = 0.6; secColor.g = 0.45; secColor.b = 0.15; // Murky brown-yellow
    } else if (currentSection === 3) {
      secColor.r = 0.65; secColor.g = 0.25; secColor.b = 0.95; // Biolum purple
    } else if (currentSection === 4) {
      secColor.r = 0.95; secColor.g = 0.7; secColor.b = 0.15; // Golden sandy glow
    }

    for (let i = 0; i < count; i++) {
      const idxX = i * 3;
      const idxY = i * 3 + 1;
      const idxZ = i * 3 + 2;

      // Dynamic fog-culling simulation: if particle is too far from player on Z axis,
      // hide/deactivate it to keep processing extremely fast (spatial skip)
      const particleZ = posArr[idxZ];
      const distZ = Math.abs(particleZ - playerZ);

      if (distZ > 170) {
        // Recycle and spawn particles near the player context if they flow past
        if (particleZ > playerZ + 40) {
          posArr[idxZ] = playerZ - 130 - Math.random() * 40;
        } else if (particleZ < playerZ - 170) {
          posArr[idxZ] = playerZ + 30 + Math.random() * 20;
        }
        continue;
      }

      // Sinuous ocean wave drift calculations
      posArr[idxY] += Math.sin(time * 0.4 + phases[i]) * 0.035;
      posArr[idxX] += Math.cos(time * 0.3 + phases[i]) * 0.02;

      // Bubble upward flow vector
      if (i % 3 === 0) {
        posArr[idxY] += 0.08; // upward rising speed
        if (posArr[idxY] > -35 + (-particleZ * 0.22) + 60) {
          // Reset bubble back to ocean floor baseline
          posArr[idxY] = -45 + (-particleZ * 0.22);
        }
      }

      // Smoothly update colors
      colArr[idxX] = THREE.MathUtils.lerp(colArr[idxX], secColor.r, 0.05);
      colArr[idxX + 1] = THREE.MathUtils.lerp(colArr[idxX + 1], secColor.g, 0.05);
      colArr[idxX + 2] = THREE.MathUtils.lerp(colArr[idxX + 2], secColor.b, 0.05);
    }

    positionsAttr.needsUpdate = true;
    colorsAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.7}
        depthWrite={false}
        vertexColors={true}
        blending={AdditiveBlending}
      />
    </points>
  );
}
