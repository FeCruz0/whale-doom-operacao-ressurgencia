"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getRouteX, useGameStore } from "@/store/useGameStore";
import { playerPositionRef } from "./FPSControls";

export function GuidingSchool() {
  const isPlaying = useGameStore((state) => state.isPlaying);
  const isPaused = useGameStore((state) => state.isPaused);

  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const fishCount = 350;

  // Pre-generate static offsets for the boids cardume trajectory
  const fishes = useMemo(() => {
    const arr = [];
    for (let i = 0; i < fishCount; i++) {
      // Linear layout from Z=30 down to Z=-2000
      const baseZ = 30 - (i / fishCount) * 2030;
      arr.push({
        baseZ,
        phase: Math.random() * Math.PI * 2,
        speed: 1.2 + Math.random() * 0.8,
        offsetY: (Math.random() - 0.5) * 16,
        offsetX: (Math.random() - 0.5) * 14,
        scale: 0.6 + Math.random() * 0.7,
        color: new THREE.Color(
          ["#f43f5e", "#10b981", "#3b82f6", "#eab308", "#a855f7"][i % 5]
        ),
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!isPlaying || isPaused || !instancedMeshRef.current) return;

    const time = state.clock.getElapsedTime();
    const playerPos = playerPositionRef.current;
    const mesh = instancedMeshRef.current;

    for (let i = 0; i < fishCount; i++) {
      const fish = fishes[i];

      // Move fish forward along Z, looping back
      const currentZ = fish.baseZ - (time * fish.speed * 8) % 150;

      // Distance checking to perform custom frustum/fog culling
      const distZ = Math.abs(currentZ - playerPos.z);
      if (distZ > 160) {
        // Hide by scaling to zero
        dummy.position.set(0, -9999, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      // Calculate path alignment (spline guidance)
      const centerX = getRouteX(currentZ);
      const floorY = -45 + (-currentZ * 0.22);
      const centerY = floorY + 28 + Math.sin(time * 0.5 + fish.phase) * 3;

      // Swarming wiggle animation
      const wiggleX = Math.sin(time * 8 + fish.phase) * 1.8;
      const wiggleY = Math.cos(time * 6 + fish.phase) * 1.2;

      // Player Repulsion behavior (Boids swarm disperse)
      let rx = 0;
      let ry = 0;
      const dx = (centerX + fish.offsetX + wiggleX) - playerPos.x;
      const dy = (centerY + fish.offsetY + wiggleY) - playerPos.y;
      const distSq = dx * dx + dy * dy + distZ * distZ;

      if (distSq < 400) { // dentro de 20m de aproximação
        const dist = Math.sqrt(distSq) || 1;
        const force = (20 - dist) / 20;
        rx = (dx / dist) * force * 15;
        ry = (dy / dist) * force * 10;
      }

      dummy.position.set(
        centerX + fish.offsetX + wiggleX + rx,
        centerY + fish.offsetY + wiggleY + ry,
        currentZ
      );

      // Rotate to orient fish naturally along trajectory with active wiggles
      dummy.rotation.set(
        Math.sin(time * 3 + fish.phase) * 0.15,
        Math.PI + Math.sin(time * 7 + fish.phase) * 0.2,
        0
      );

      dummy.scale.set(fish.scale, fish.scale, fish.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, fish.color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  if (!isPlaying) return null;

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[null as any, null as any, fishCount]}
      castShadow
    >
      <coneGeometry args={[0.35, 1.3, 4]} />
      <meshBasicMaterial />
    </instancedMesh>
  );
}
