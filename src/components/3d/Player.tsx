"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";
import { useKeyboard } from "@/hooks/useKeyboard";

export function Player() {
  const groupRef = useRef<THREE.Group>(null);
  const isPlaying = useGameStore((state) => state.isPlaying);
  const isPaused = useGameStore((state) => state.isPaused);
  const keys = useKeyboard();

  useFrame((state, delta) => {
    if (!groupRef.current || !isPlaying || isPaused) return;

    const cam = state.camera;
    const weapon = groupRef.current;

    // Check if the player is actively moving to trigger realistic bobbing
    const isMoving = keys.forward || keys.backward || keys.left || keys.right || keys.up || keys.down;
    const time = state.clock.getElapsedTime();

    // Target local offset relative to camera view
    // 1.2 units to the right, 1.0 unit down, 2.3 units forward (Z = -2.3)
    const localOffset = new THREE.Vector3(1.3, -1.0, -2.4);

    // Apply camera rotation to the offset to keep it locked to the bottom right
    localOffset.applyQuaternion(cam.quaternion);

    // Calculate dynamic gun bobbing when swimming
    let bobX = 0;
    let bobY = 0;
    if (isMoving) {
      bobX = Math.sin(time * 6) * 0.06;
      bobY = Math.abs(Math.cos(time * 12)) * 0.05 - 0.02;
    }

    const bobOffset = new THREE.Vector3(bobX, bobY, 0);
    bobOffset.applyQuaternion(cam.quaternion);

    // Smoothly interpolate (lerp) weapon position to target to avoid micro-jitter
    const targetPosition = cam.position.clone().add(localOffset).add(bobOffset);
    weapon.position.lerp(targetPosition, 16 * delta);

    // Match rotation smoothly
    weapon.quaternion.slerp(cam.quaternion, 16 * delta);
  });

  if (!isPlaying) return null;

  return (
    <group ref={groupRef}>
      {/* 3D Cyber Snout Cannon / Harpoon */}
      <group rotation={[0.0, Math.PI, 0]}>
        {/* Cannon Main Chamber */}
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.35, 1.4]} />
          <meshStandardMaterial
            color="#0f172a" // dark slate metal
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>

        {/* Double-Barrel snouts */}
        <mesh position={[-0.08, 0, 0.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.8, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0.08, 0, 0.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.8, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Glowing Neon Cyan Energy Core inside weapon */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.15, 0.15, 0.8]} />
          <meshBasicMaterial color="#06b6d4" />
        </mesh>

        {/* Weapon Handle/Mounting base */}
        <mesh position={[0, -0.2, -0.4]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.2, 0.4, 0.2]} />
          <meshStandardMaterial color="#334155" metalness={0.7} />
        </mesh>
      </group>
    </group>
  );
}
export { playerPositionRef } from "./FPSControls";
