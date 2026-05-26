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
  const updateSection = useGameStore((state) => state.updateSection);

  const speed = 18; // Reduced speed for heavier, more graceful movement
  const boundary = {
    x: 75,
    y: 460, // Increased maximum height to accommodate the climb up to the surface
    z: { min: -2000, max: 30 }
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
    if (keys.right) moveVec.current.add(rightVec.current); // Fixed inversion
    if (keys.left) moveVec.current.sub(rightVec.current);

    // Vertical Deep-Sea natação (Space = Subir, Shift = Descer)
    if (keys.up) moveVec.current.y += 1.0;
    if (keys.down) moveVec.current.y -= 1.0;

    // 2. Propose new position after movement
    const nextPos = camera.position.clone();
    if (moveVec.current.lengthSq() > 0) {
      moveVec.current.normalize().multiplyScalar(speed * delta);
      nextPos.add(moveVec.current);
    }

    // A. Dynamic Seabed (Chão) and Ceiling (Teto) Collision Constraints
    // Floor baseline Y = -45 + (-z * 0.22). Player radius = 2.5.
    const floorY = -45 + (-nextPos.z * 0.22);
    const minPlayerY = floorY + 2.5; 
    const maxPlayerY = floorY + 68.0; // Invisible ocean teto (ceiling height 68 units above seabed)

    nextPos.y = THREE.MathUtils.clamp(nextPos.y, minPlayerY, maxPlayerY);

    // B. Left/Right Wall Boundaries (Clamps X according to Z section)
    // Section 3 (canyon) is narrow: Z in [-1600, -1000] -> clamp X to [-22, 22]
    if (nextPos.z <= -1000 && nextPos.z >= -1600) {
      nextPos.x = THREE.MathUtils.clamp(nextPos.x, -21.5, 21.5);
    } else {
      nextPos.x = THREE.MathUtils.clamp(nextPos.x, -72.0, 72.0);
    }
    
    // Z limits
    nextPos.z = THREE.MathUtils.clamp(nextPos.z, boundary.z.min, boundary.z.max);

    // C. Static Obstacle Collision Resolution (Pillars, Corals, Portal, Shipwreck)
    const OBSTACLES = [
      // Section 2 Pillars (Cylinders)
      { type: "cylinder", x: -60, z: -550, radius: 10 },
      { type: "cylinder", x: -50, z: -800, radius: 12 },
      { type: "cylinder", x: 60, z: -700, radius: 11 },
      { type: "cylinder", x: 55, z: -950, radius: 13 },
      // Section 4 Corals (Spheres)
      { type: "sphere", x: -35, y: 304, z: -1700, radius: 5 },
      { type: "sphere", x: 35, y: 326, z: -1800, radius: 6 },
      { type: "sphere", x: -15, y: 348, z: -1900, radius: 4 },
      // Portal Pillars (Cylinders)
      { type: "cylinder", x: -25, z: -1980, radius: 2.5 },
      { type: "cylinder", x: 25, z: -1980, radius: 2.5 },
      // Vapor Harlingen Cargueiro Colliders (Z=-1780, Arraial shallow section)
      { type: "cylinder", x: -15, z: -1765, radius: 5 }, // Left boiler
      { type: "cylinder", x: 15, z: -1795, radius: 5 },  // Right boiler
      { type: "box", xMin: -10, xMax: 10, yMin: 285, yMax: 315, zMin: -1795, zMax: -1770 } // Hull rib clump
    ];

    const playerRadius = 2.5;

    for (const obs of OBSTACLES) {
      if (obs.type === "cylinder") {
        const cyl = obs as { x: number; z: number; radius: number };
        const dx = nextPos.x - cyl.x;
        const dz = nextPos.z - cyl.z;
        const distXZ = Math.sqrt(dx * dx + dz * dz);
        const minDist = cyl.radius + playerRadius;
        
        if (distXZ < minDist) {
          // Slide along cylinder surface: push position outwards
          const overlap = minDist - distXZ;
          nextPos.x += (dx / distXZ) * overlap;
          nextPos.z += (dz / distXZ) * overlap;
        }
      } else if (obs.type === "sphere") {
        const sph = obs as { x: number; y?: number; z: number; radius: number };
        const dx = nextPos.x - sph.x;
        const dy = nextPos.y - (sph.y || 0);
        const dz = nextPos.z - sph.z;
        const distXYZ = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const minDist = sph.radius + playerRadius;
        
        if (distXYZ < minDist) {
          // Slide along sphere surface: push position outwards
          const overlap = minDist - distXYZ;
          nextPos.x += (dx / distXYZ) * overlap;
          nextPos.y += (dy / distXYZ) * overlap;
          nextPos.z += (dz / distXYZ) * overlap;
        }
      } else if (obs.type === "box") {
        const box = obs as { xMin: number; xMax: number; yMin: number; yMax: number; zMin: number; zMax: number };
        const px = nextPos.x;
        const py = nextPos.y;
        const pz = nextPos.z;
        const r = playerRadius;
        
        // Check overlap on all three axes
        const overlapX = (px + r > box.xMin) && (px - r < box.xMax);
        const overlapY = (py + r > box.yMin) && (py - r < box.yMax);
        const overlapZ = (pz + r > box.zMin) && (pz - r < box.zMax);
        
        if (overlapX && overlapY && overlapZ) {
          // Push out along the axis of minimum penetration for smooth sliding
          const dx1 = Math.abs(px + r - box.xMin);
          const dx2 = Math.abs(box.xMax - (px - r));
          const dy1 = Math.abs(py + r - box.yMin);
          const dy2 = Math.abs(box.yMax - (py - r));
          const dz1 = Math.abs(pz + r - box.zMin);
          const dz2 = Math.abs(box.zMax - (pz - r));
          
          const minOverlap = Math.min(dx1, dx2, dy1, dy2, dz1, dz2);
          
          if (minOverlap === dx1) nextPos.x -= dx1;
          else if (minOverlap === dx2) nextPos.x += dx2;
          else if (minOverlap === dy1) nextPos.y -= dy1;
          else if (minOverlap === dy2) nextPos.y += dy2;
          else if (minOverlap === dz1) nextPos.z -= dz1;
          else if (minOverlap === dz2) nextPos.z += dz2;
        }
      }
    }

    // D. Apply resolved position to camera
    camera.position.copy(nextPos);

    // Update section in store based on player position
    updateSection(camera.position.z);

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
