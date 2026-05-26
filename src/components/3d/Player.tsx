"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useGameStore } from "@/store/useGameStore";

// High-performance shared reference for the player position (accessed by FloatingObjects.tsx)
export const playerPositionRef = { current: new THREE.Vector3(0, 0, 0) };

export function Player() {
  const meshRef = useRef<THREE.Group>(null);
  const keys = useKeyboard();
  
  const isPlaying = useGameStore((state) => state.isPlaying);
  const isPaused = useGameStore((state) => state.isPaused);
  const useBoost = useGameStore((state) => state.useBoost);
  const rechargeBoost = useGameStore((state) => state.rechargeBoost);

  // Speed and physics factors
  const speed = 25; // Units per second
  const lerpFactor = 8; // Interpolation speed for smooth handling
  
  // Boundary constraints
  const bounds = {
    x: 22,
    y: 13,
  };

  // Keep track of target rotations for banking
  const targetRotation = useRef({ x: 0, y: 0, z: 0 });
  const thrusterScaleRef = useRef(1);

  // Reset player position on game start / reset
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(0, 0, 0);
      playerPositionRef.current.set(0, 0, 0);
    }
  }, [isPlaying]);

  useFrame((state, delta) => {
    if (!meshRef.current || !isPlaying || isPaused) return;

    const mesh = meshRef.current;

    // 1. Calculate Movements
    let dx = 0;
    let dy = 0;

    if (keys.left) dx = -1;
    if (keys.right) dx = 1;
    if (keys.forward) dy = 1;
    if (keys.backward) dy = -1;

    // Apply Boost state
    let activeSpeedMultiplier = 1;
    if (keys.boost) {
      // Consume boost in Zustand store
      const hasBoost = useBoost(25 * delta); // Consumes 25 units of boost per second
      if (hasBoost) {
        activeSpeedMultiplier = 1.8;
        thrusterScaleRef.current = THREE.MathUtils.lerp(thrusterScaleRef.current, 2.5, lerpFactor * delta);
      } else {
        thrusterScaleRef.current = THREE.MathUtils.lerp(thrusterScaleRef.current, 1, lerpFactor * delta);
      }
    } else {
      rechargeBoost(10 * delta); // Recharges 10 units of boost per second
      thrusterScaleRef.current = THREE.MathUtils.lerp(thrusterScaleRef.current, 1, lerpFactor * delta);
    }

    // Update positions
    const targetX = THREE.MathUtils.clamp(
      mesh.position.x + dx * speed * activeSpeedMultiplier * delta,
      -bounds.x,
      bounds.x
    );
    const targetY = THREE.MathUtils.clamp(
      mesh.position.y + dy * speed * activeSpeedMultiplier * delta,
      -bounds.y,
      bounds.y
    );

    // Smooth position interpolation
    mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, targetX, lerpFactor * delta);
    mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, targetY, lerpFactor * delta);

    // Update shared ref for collision calculations
    playerPositionRef.current.copy(mesh.position);

    // 2. Dynamic Rotations (Banking)
    // Bank on X movement: roll along Z axis
    targetRotation.current.z = -dx * 0.4;
    // Pitch on Y movement: rotate along X axis
    targetRotation.current.x = -dy * 0.25;
    // Yaw on X movement: rotate along Y axis slightly
    targetRotation.current.y = dx * 0.2;

    // Apply rotations smoothly
    mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, targetRotation.current.x, lerpFactor * delta);
    mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, targetRotation.current.y, lerpFactor * delta);
    mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, targetRotation.current.z, lerpFactor * delta);

    // Update thruster visual scale
    const thrusterLeft = mesh.getObjectByName("thruster-l");
    const thrusterRight = mesh.getObjectByName("thruster-r");
    if (thrusterLeft && thrusterRight) {
      thrusterLeft.scale.setScalar(thrusterScaleRef.current);
      thrusterRight.scale.setScalar(thrusterScaleRef.current);
    }

    // 3. Smooth Camera Tracking
    // Make camera follow player slightly for dynamic depth feel
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, mesh.position.x * 0.4, 4 * delta);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, mesh.position.y * 0.4 + 4, 4 * delta);
    state.camera.lookAt(mesh.position.x * 0.7, mesh.position.y * 0.7, -25);
  });

  return (
    <group ref={meshRef}>
      {/* 3D Vessel Design - "The Whale" */}
      
      {/* Main Body (Sleek aerodynamic capsule) */}
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[1, 3.5, 8, 16]} />
        <meshStandardMaterial
          color="#1e293b" // slate dark body
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Cockpit canopy (Glassmorphic) */}
      <mesh position={[0, 0.4, 0.8]} castShadow>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial
          color="#06b6d4" // Neon cyan glass
          roughness={0.0}
          metalness={0.9}
          transparent={true}
          opacity={0.6}
        />
      </mesh>

      {/* Left Wing (Stabilizer) */}
      <mesh position={[-1.7, -0.1, -0.5]} rotation={[0, 0, -0.2]} castShadow>
        <boxGeometry args={[1.8, 0.15, 1.2]} />
        <meshStandardMaterial
          color="#0f172a" // even darker slate
          roughness={0.3}
          metalness={0.9}
        />
      </mesh>
      
      {/* Right Wing (Stabilizer) */}
      <mesh position={[1.7, -0.1, -0.5]} rotation={[0, 0, 0.2]} castShadow>
        <boxGeometry args={[1.8, 0.15, 1.2]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.3}
          metalness={0.9}
        />
      </mesh>

      {/* Futuristic Dorsal Fin (The "Whale" tail/sail) */}
      <mesh position={[0, 1, -1]} rotation={[-0.4, 0, 0]} castShadow>
        <boxGeometry args={[0.15, 1.4, 1]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.3}
          metalness={0.9}
        />
      </mesh>

      {/* Left Engine Thruster Visuals */}
      <group position={[-0.55, -0.2, -1.9]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.25, 0.6, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        {/* Glow Jet */}
        <mesh name="thruster-l" position={[0, 0, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.25, 1, 12]} />
          <meshBasicMaterial
            color="#06b6d4" // cyber cyan glow
            transparent={true}
            opacity={0.8}
          />
        </mesh>
      </group>

      {/* Right Engine Thruster Visuals */}
      <group position={[0.55, -0.2, -1.9]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.25, 0.6, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        {/* Glow Jet */}
        <mesh name="thruster-r" position={[0, 0, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.25, 1, 12]} />
          <meshBasicMaterial
            color="#06b6d4" // cyber cyan glow
            transparent={true}
            opacity={0.8}
          />
        </mesh>
      </group>

      {/* Spot Lights from ship pointing forward */}
      <spotLight
        position={[0, 0.2, 2]}
        angle={Math.PI / 6}
        penumbra={0.5}
        intensity={15}
        distance={60}
        color="#06b6d4"
        castShadow
      />
    </group>
  );
}
