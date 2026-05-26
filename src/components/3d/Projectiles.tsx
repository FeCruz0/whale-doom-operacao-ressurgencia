"use client";

import { useGameStore } from "@/store/useGameStore";
import * as THREE from "three";

export function Projectiles() {
  const projectiles = useGameStore((state) => state.projectiles);

  return (
    <group>
      {projectiles.map((proj) => (
        <mesh key={proj.id} position={proj.position}>
          {/* Bubble Sphere */}
          <sphereGeometry args={[0.4, 8, 8]} />
          <meshStandardMaterial
            color="#22d3ee" // Cyan bubble
            emissive="#06b6d4"
            emissiveIntensity={3.0}
            roughness={0.0}
            metalness={1.0}
            transparent={true}
            opacity={0.7}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
