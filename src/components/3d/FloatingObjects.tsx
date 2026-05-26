"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";
import { playerPositionRef } from "./FPSControls";

export function FloatingObjects() {
  const isPlaying = useGameStore((state) => state.isPlaying);
  const isPaused = useGameStore((state) => state.isPaused);
  const trashList = useGameStore((state) => state.trash);
  const damagePlayer = useGameStore((state) => state.damagePlayer);

  const invulnTimeRef = useRef(0);

  useFrame((state, delta) => {
    if (!isPlaying || isPaused) return;

    // Tick invulnerability frame countdown
    if (invulnTimeRef.current > 0) {
      invulnTimeRef.current -= delta;
    }

    const playerPos = playerPositionRef.current;

    // Check collision between player (FPV camera) and static debris (demons)
    for (const trash of trashList) {
      const dx = playerPos.x - trash.position[0];
      const dy = playerPos.y - trash.position[1];
      const dz = playerPos.z - trash.position[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Hit range (adding standard player hull radius: 1.5 units)
      const hitLimit = trash.hitRadius + 1.2;

      if (dist < hitLimit) {
        if (invulnTimeRef.current <= 0) {
          damagePlayer(1); // 1 damage
          invulnTimeRef.current = 1.5; // 1.5 seconds invulnerability
        }
      }
    }
  });

  return (
    <group>
      {trashList.map((trash) => {
        const size = trash.size;

        return (
          <group key={trash.id} position={trash.position}>
            {trash.type === "toxic-barrel" && (
              <mesh castShadow receiveShadow>
                {/* Yellow Toxic Barrel Cylinder */}
                <cylinderGeometry args={[size * 0.5, size * 0.5, size * 1.3, 12]} />
                <meshStandardMaterial
                  color="#eab308" // toxic yellow
                  emissive="#a16207"
                  emissiveIntensity={0.5}
                  roughness={0.4}
                  metalness={0.6}
                />
                {/* Radioactive glowing ring details */}
                <mesh position={[0, size * 0.45, 0]}>
                  <torusGeometry args={[size * 0.52, size * 0.05, 6, 12]} />
                  <meshBasicMaterial color="#22c55e" /> {/* Acid Green glow */}
                </mesh>
                <mesh position={[0, -size * 0.45, 0]}>
                  <torusGeometry args={[size * 0.52, size * 0.05, 6, 12]} />
                  <meshBasicMaterial color="#22c55e" />
                </mesh>
              </mesh>
            )}

            {trash.type === "plastic-bag" && (
              <mesh castShadow>
                {/* Transparent radioactive plastic clump */}
                <dodecahedronGeometry args={[size * 0.6, 1]} />
                <meshStandardMaterial
                  color="#a855f7" // purple bag
                  emissive="#c084fc"
                  emissiveIntensity={1.0}
                  roughness={0.1}
                  metalness={0.9}
                  transparent={true}
                  opacity={0.6}
                />
              </mesh>
            )}

            {trash.type === "scrap-metal" && (
              <mesh castShadow receiveShadow>
                {/* Rusty heavy metal box blocks */}
                <boxGeometry args={[size, size, size]} />
                <meshStandardMaterial
                  color="#ef4444" // red scrap metal
                  emissive="#7f1d1d"
                  emissiveIntensity={0.6}
                  roughness={0.8}
                  metalness={0.8}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
