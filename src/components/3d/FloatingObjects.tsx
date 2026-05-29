"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore, TrashItem } from "@/store/useGameStore";
import { playerPositionRef } from "./FPSControls";

export function FloatingObjects() {

  const isPlaying = useGameStore((state) => state.isPlaying);
  const isPaused = useGameStore((state) => state.isPaused);
  const trashList = useGameStore((state) => state.trash);
  const damagePlayer = useGameStore((state) => state.damagePlayer);

  const invulnTimeRef = useRef(0);
  const trashRefs = useRef<{ [id: number]: THREE.Group }>({});

  useFrame((state, delta) => {
    if (!isPlaying || isPaused) return;

    // Tick invulnerability frame countdown
    if (invulnTimeRef.current > 0) {
      invulnTimeRef.current -= delta;
    }

    const playerPos = playerPositionRef.current;

    // Check collision between player (FPV camera) and static debris (demons)
    for (const trash of trashList) {
      const group = trashRefs.current[trash.id];
      const tz = trash.position[2];
      const distZ = Math.abs(tz - playerPos.z);

      // GPU & CPU Culling: hide objects out of active fog range (175 units)
      if (distZ > 175) {
        if (group) group.visible = false;
        continue;
      }
      if (group) group.visible = true;

      // Calculate animated/oscillating positions if floating
      let tx = trash.position[0];
      let ty = trash.position[1];

      const phase = trash.phaseOffset || 0;
      const elapsedTime = state.clock.getElapsedTime();

      // Only bob if NOT falling
      if (!trash.velocity) {
        tx += Math.sin(elapsedTime * 0.8 + phase) * 2.0; // gentle sway left-right
        ty += Math.sin(elapsedTime * 1.4 + phase) * 0.8; // gentle bob up-down
      }

      const dx = playerPos.x - tx;
      const dy = playerPos.y - ty;
      const dz = playerPos.z - tz;
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
      {trashList.map((trash: TrashItem) => {
        const size = trash.size;
        const phase = trash.phaseOffset || 0;

        // Custom bob animation state calculations (for rendering offset positioning)
        // Note: useFrame adjusts physics, but we can animate mesh group position relative to coordinate
        return (
          <group
            key={trash.id}
            position={trash.position}
            ref={(el) => {
              if (el) {
                trashRefs.current[trash.id] = el;
              } else {
                delete trashRefs.current[trash.id];
              }
            }}
          >

            {/* Inner bobbing envelope group */}
            <group 
              position={
                trash.velocity 
                  ? [0, 0, 0] 
                  : [
                      Math.sin(phase) * 0.5, 
                      Math.sin(phase * 1.5) * 0.3, 
                      0
                    ]
              }
            >
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
                <group scale={[1, 1.2, 0.5]}>
                  {/* Main bag body (wrinkled/clumpy look) */}
                  <mesh castShadow>
                    <dodecahedronGeometry args={[size * 0.5, 0]} />
                    <meshStandardMaterial
                      color="#a855f7" // purple bag
                      emissive="#c084fc"
                      emissiveIntensity={1.0}
                      roughness={0.1}
                      metalness={0.9}
                      transparent={true}
                      opacity={0.65}
                    />
                  </mesh>
                  {/* Left handle */}
                  <mesh position={[-size * 0.22, size * 0.45, 0]} rotation={[0, 0, 0.3]} castShadow>
                    <torusGeometry args={[size * 0.15, size * 0.035, 6, 12, Math.PI]} />
                    <meshStandardMaterial
                      color="#a855f7"
                      emissive="#c084fc"
                      emissiveIntensity={1.0}
                      roughness={0.1}
                      metalness={0.9}
                      transparent={true}
                      opacity={0.65}
                    />
                  </mesh>
                  {/* Right handle */}
                  <mesh position={[size * 0.22, size * 0.45, 0]} rotation={[0, 0, -0.3]} castShadow>
                    <torusGeometry args={[size * 0.15, size * 0.035, 6, 12, Math.PI]} />
                    <meshStandardMaterial
                      color="#a855f7"
                      emissive="#c084fc"
                      emissiveIntensity={1.0}
                      roughness={0.1}
                      metalness={0.9}
                      transparent={true}
                      opacity={0.65}
                    />
                  </mesh>
                  {/* Bottom knot/wrinkle */}
                  <mesh position={[0, -size * 0.45, 0]} castShadow>
                    <sphereGeometry args={[size * 0.12, 6, 6]} />
                    <meshStandardMaterial
                      color="#a855f7"
                      emissive="#c084fc"
                      emissiveIntensity={1.0}
                      roughness={0.1}
                      transparent={true}
                      opacity={0.65}
                    />
                  </mesh>
                </group>
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

              {trash.type === "plastic-bottle" && (
                <group rotation={[1.2, 0.4, 0.8]}>
                  <mesh castShadow receiveShadow>
                    {/* Bottle body - changed to bright neon green */}
                    <cylinderGeometry args={[size * 0.18, size * 0.18, size * 0.7, 8]} />
                    <meshStandardMaterial
                      color="#22c55e" // bright green
                      emissive="#15803d"
                      emissiveIntensity={1.0}
                      roughness={0.05}
                      metalness={0.2}
                      transparent={true}
                      opacity={0.85}
                    />
                  </mesh>
                  <mesh position={[0, size * 0.38, 0]} castShadow>
                    {/* Bottle neck */}
                    <cylinderGeometry args={[size * 0.08, size * 0.08, size * 0.12, 8]} />
                    <meshStandardMaterial color="#4ade80" transparent={true} opacity={0.85} />
                  </mesh>
                  <mesh position={[0, size * 0.45, 0]}>
                    {/* Bottle cap */}
                    <cylinderGeometry args={[size * 0.09, size * 0.09, size * 0.05, 8]} />
                    <meshStandardMaterial color="#ffffff" />
                  </mesh>
                </group>
              )}

              {trash.type === "floating-bag" && (
                <group scale={[1, 1.2, 0.5]} rotation={[0.4, 0.2, 0.9]}>
                  {/* Main bag body */}
                  <mesh castShadow>
                    <dodecahedronGeometry args={[size * 0.48, 0]} />
                    <meshStandardMaterial
                      color="#e2e8f0"
                      emissive="#94a3b8"
                      emissiveIntensity={0.3}
                      roughness={0.2}
                      metalness={0.1}
                      transparent={true}
                      opacity={0.55}
                    />
                  </mesh>
                  {/* Left handle */}
                  <mesh position={[-size * 0.2, size * 0.42, 0]} rotation={[0, 0, 0.3]} castShadow>
                    <torusGeometry args={[size * 0.14, size * 0.035, 6, 12, Math.PI]} />
                    <meshStandardMaterial
                      color="#e2e8f0"
                      emissive="#94a3b8"
                      emissiveIntensity={0.3}
                      roughness={0.2}
                      metalness={0.1}
                      transparent={true}
                      opacity={0.55}
                    />
                  </mesh>
                  {/* Right handle */}
                  <mesh position={[size * 0.2, size * 0.42, 0]} rotation={[0, 0, -0.3]} castShadow>
                    <torusGeometry args={[size * 0.14, size * 0.035, 6, 12, Math.PI]} />
                    <meshStandardMaterial
                      color="#e2e8f0"
                      emissive="#94a3b8"
                      emissiveIntensity={0.3}
                      roughness={0.2}
                      metalness={0.1}
                      transparent={true}
                      opacity={0.55}
                    />
                  </mesh>
                  {/* Bottom knot/wrinkle */}
                  <mesh position={[0, -size * 0.42, 0]} castShadow>
                    <sphereGeometry args={[size * 0.12, 6, 6]} />
                    <meshStandardMaterial
                      color="#e2e8f0"
                      emissive="#94a3b8"
                      emissiveIntensity={0.3}
                      roughness={0.2}
                      transparent={true}
                      opacity={0.55}
                    />
                  </mesh>
                </group>
              )}

              {trash.type === "ghost-net" && (
                <group>
                  <mesh castShadow receiveShadow>
                    <boxGeometry args={[size * 1.5, size * 1.5, 0.2]} />
                    <meshStandardMaterial
                      color="#475569"
                      roughness={0.9}
                      wireframe={true}
                    />
                  </mesh>
                  <mesh position={[-size * 0.5, size * 0.7, 0]}>
                    <torusGeometry args={[size * 0.15, size * 0.08, 6, 8]} />
                    <meshStandardMaterial color="#f97316" roughness={0.5} />
                  </mesh>
                  <mesh position={[size * 0.5, size * 0.7, 0]}>
                    <torusGeometry args={[size * 0.15, size * 0.08, 6, 8]} />
                    <meshStandardMaterial color="#f97316" roughness={0.5} />
                  </mesh>
                </group>
              )}

              {trash.type === "tin-can" && (
                <mesh castShadow receiveShadow rotation={[0.8, 0.4, 0]}>
                  <cylinderGeometry args={[size * 0.22, size * 0.22, size * 0.5, 8]} />
                  <meshStandardMaterial
                    color="#94a3b8"
                    roughness={0.3}
                    metalness={0.8}
                  />
                </mesh>
              )}

              {trash.type === "tire" && (
                <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0.2, 0]}>
                  <torusGeometry args={[size * 0.38, size * 0.16, 8, 16]} />
                  <meshStandardMaterial
                    color="#1e293b"
                    roughness={0.85}
                    metalness={0.1}
                  />
                </mesh>
              )}
            </group>
          </group>
        );
      })}
    </group>
  );
}
