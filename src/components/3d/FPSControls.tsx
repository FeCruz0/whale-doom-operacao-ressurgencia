"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useGameStore } from "@/store/useGameStore";

// Export camera position ref for collision detection by static debris (demons)
export const playerPositionRef = { current: new THREE.Vector3(0, 0, 0) };

export function FPSControls() {
  const { camera } = useThree();
  const keys = useKeyboard();
  const isPlaying = useGameStore((state) => state.isPlaying);
  const isPaused = useGameStore((state) => state.isPaused);
  const shootBubble = useGameStore((state) => state.shootBubble);
  const updateWorld = useGameStore((state) => state.updateWorld);

  const speed = 40; // Swimming speed (units/sec)
  const boundary = {
    x: 75,
    y: 45,
    z: { min: -190, max: 30 }
  };

  // Keep track of player position via local vector
  const playerPos = useRef(new THREE.Vector3(0, 0, 0));

  // Temp vectors to avoid garbage collection
  const forwardVec = useRef(new THREE.Vector3());
  const rightVec = useRef(new THREE.Vector3());
  const moveVec = useRef(new THREE.Vector3());

  // Listen to left-click to shoot bubbles when game is active and not paused
  useEffect(() => {
    const handleMouseClick = (e: MouseEvent) => {
      if (!isPlaying || isPaused) return;
      if (document.pointerLockElement === null) return; // Only shoot if locked

      if (e.button === 0) {
        // Get camera direction
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        
        // Spawn projectile slightly ahead of the camera view
        const origin: [number, number, number] = [
          camera.position.x + dir.x * 2.0,
          camera.position.y + dir.y * 2.0 - 0.5, // slightly down (from whale snout)
          camera.position.z + dir.z * 2.0,
        ];
        
        shootBubble(origin, [dir.x, dir.y, dir.z]);
      }
    };

    window.addEventListener("mousedown", handleMouseClick);
    return () => {
      window.removeEventListener("mousedown", handleMouseClick);
    };
  }, [camera, isPlaying, isPaused, shootBubble]);

  // Reset player position on new session
  useEffect(() => {
    if (isPlaying) {
      camera.position.set(0, 0, 15); // Start slightly back
      playerPos.current.set(0, 0, 15);
      playerPositionRef.current.copy(camera.position);
    }
  }, [isPlaying, camera]);

  useFrame((state, delta) => {
    if (!isPlaying || isPaused) return;

    // Apply delta updates in store
    updateWorld(delta);

    // 1. Calculate direction vectors from camera matrix
    camera.getWorldDirection(forwardVec.current);
    
    // Calculate right vector by cross product of forward and world UP
    rightVec.current.crossVectors(forwardVec.current, new THREE.Vector3(0, 1, 0)).normalize();

    // Reset movement vector
    moveVec.current.set(0, 0, 0);

    // WASD movement
    if (keys.forward) moveVec.current.add(forwardVec.current);
    if (keys.backward) moveVec.current.sub(forwardVec.current);
    if (keys.right) moveVec.current.sub(rightVec.current); // Right-vector cross-product points left by default, sub moves right
    if (keys.left) moveVec.current.add(rightVec.current);

    // Vertical Deep-Sea natação (Space = Subir, Shift = Descer)
    if (keys.up) moveVec.current.y += 1.0;
    if (keys.down) moveVec.current.y -= 1.0;

    // Normalize and scale by speed
    if (moveVec.current.lengthSq() > 0) {
      moveVec.current.normalize().multiplyScalar(speed * delta);
      camera.position.add(moveVec.current);
    }

    // 2. Bound constraints
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -boundary.x, boundary.x);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, -boundary.y, boundary.y);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, boundary.z.min, boundary.z.max);

    // Update shared ref for obstacle collision calculation
    playerPositionRef.current.copy(camera.position);
  });

  return (
    <PointerLockControls
      onLock={() => useGameStore.setState({ isPaused: false })}
      onUnlock={() => useGameStore.setState({ isPaused: true })}
    />
  );
}
