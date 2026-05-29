"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useGameStore, getRouteX } from "@/store/useGameStore";

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
  const oilSlicks = useGameStore((state) => state.oilSlicks);
  const setInOilSlick = useGameStore((state) => state.setInOilSlick);

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
    updateWorld(delta, camera.position);

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

    // Dynamic Ocean Currents (force field) inside Section 3 (Boqueirão canyon, z: -1000 to -1600)
    // Lateral current push (oscillating left/right flow) that players must actively steer against
    if (nextPos.z <= -1000 && nextPos.z >= -1600) {
      const time = state.clock.getElapsedTime();
      const currentForce = Math.sin(time * 0.8 + nextPos.z * 0.01) * 6.5; // lateral float push force
      nextPos.x += currentForce * delta;
    }

    // A. Dynamic Seabed (Chão) and Ceiling (Teto) Collision Constraints
    // Floor Y = -45 + (-z * 0.22).
    const floorY = -45 + (-nextPos.z * 0.22);
    const minPlayerY = floorY + 2.5; 
    const maxPlayerY = floorY + 68.0;

    nextPos.y = THREE.MathUtils.clamp(nextPos.y, minPlayerY, maxPlayerY);

    // B. Curved Path Left/Right Boundaries
    // Center X is getRouteX(z). We allow a dynamic play area width depending on the section:
    // Section 3 (canyon) is narrow (width = 24), other sections are wider (width = 75).
    const pathCenterX = getRouteX(nextPos.z);
    let allowedWidth = 75;
    if (nextPos.z <= -450 && nextPos.z >= -1000) {
      allowedWidth = 40; // Section 2 canyon walls at ±42 from path center
    }
    if (nextPos.z <= -1000 && nextPos.z >= -1600) {
      allowedWidth = 24; // narrow canyon width
    }
    nextPos.x = THREE.MathUtils.clamp(nextPos.x, pathCenterX - allowedWidth, pathCenterX + allowedWidth);

    // C. Static Obstacle Collision Resolution (Pillars, Corals, Portal, Shipwreck, Orcas)
    // Synchronize layout position with getRouteX and floorY
    const OBSTACLES = [
      // Section 2 Canyon Left Wall (spans Z -450 to -1000, dynamic curving inner face at pathCenter-40)
      { type: "box",
        xMin: getRouteX(nextPos.z) - 56,
        xMax: getRouteX(nextPos.z) - 40,
        yMin: -100, yMax: 500,
        zMin: -1005, zMax: -445
      },
      // Section 2 Canyon Right Wall (spans Z -450 to -1000, dynamic curving inner face at pathCenter+40)
      { type: "box",
        xMin: getRouteX(nextPos.z) + 40,
        xMax: getRouteX(nextPos.z) + 56,
        yMin: -100, yMax: 500,
        zMin: -1005, zMax: -445
      },
      // Section 4 Corals (at visual floor — decorative, below player swim range)
      { type: "sphere", x: getRouteX(-1700) - 35, y: 289, z: -1700, radius: 5 },
      { type: "sphere", x: getRouteX(-1800) + 35, y: 311, z: -1800, radius: 6 },
      { type: "sphere", x: getRouteX(-1900) - 15, y: 333, z: -1900, radius: 4 },
      // Portal Pillars (pillar center at visualFloor+30 = 380.6, pillars from 350.6 to 410.6)
      { type: "cylinder", x: getRouteX(-1980) - 25, z: -1980, radius: 8, yMin: 350.6, yMax: 410.6 },
      { type: "cylinder", x: getRouteX(-1980) + 25, z: -1980, radius: 8, yMin: 350.6, yMax: 410.6 },
      // Vapor Harlingen Cargueiro Colliders (Z=-1780)
      { type: "cylinder", x: getRouteX(-1780) - 15, z: -1765, radius: 5, yMin: 285, yMax: 325 },
      { type: "cylinder", x: getRouteX(-1780) + 15, z: -1795, radius: 5, yMin: 285, yMax: 325 },
      { type: "box", xMin: getRouteX(-1780) - 10, xMax: getRouteX(-1780) + 10, yMin: 285, yMax: 315, zMin: -1795, zMax: -1770 }
    ];

    const playerRadius = 2.5;

    for (const obs of OBSTACLES) {
      if (obs.type === "cylinder") {
        const cyl = obs as { x: number; z: number; radius: number; yMin?: number; yMax?: number };
        const yOverlap = (cyl.yMin === undefined || nextPos.y + playerRadius > cyl.yMin) && 
                        (cyl.yMax === undefined || nextPos.y - playerRadius < cyl.yMax);
        if (yOverlap) {
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

    // Dynamic FOV Camera effect for Section 3 (Boqueirão canyon claustrophobia)
    // base FOV is 60. We reduce FOV towards 45 to enhance speed feel & zoom-in look in Boqueirão (z: -1000 to -1600)
    let targetFov = 60;
    if (camera.position.z <= -1000 && camera.position.z >= -1600) {
      const canyonPct = (camera.position.z - -1000) / (-1600 - -1000); // 0 to 1
      const sinFactor = Math.sin(canyonPct * Math.PI); // peak in the middle
      targetFov = 60 - (sinFactor * 16);
    }
    const persCam = camera as THREE.PerspectiveCamera;
    if (persCam.isPerspectiveCamera) {
      persCam.fov = THREE.MathUtils.lerp(persCam.fov, targetFov, 0.05);
      persCam.updateProjectionMatrix();
    }

    // Update section in store based on player position
    updateSection(camera.position.z);

    // E. Check if player is inside any oil slick
    let inSlick = false;
    for (const slick of oilSlicks) {
      const dx = camera.position.x - slick.position[0];
      const dy = camera.position.y - slick.position[1];
      const dz = camera.position.z - slick.position[2];
      const distXZ = Math.sqrt(dx * dx + dz * dz);
      // Check XZ radius proximity and vertical proximity within a thin column (Y height +/- 5 units)
      if (distXZ < slick.radius && Math.abs(dy) < 5.0) {
        inSlick = true;
        // Trigger light smartphone vibration when in dangerous oil slicks
        if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate && Math.random() < 0.1) {
          window.navigator.vibrate([40]);
        }
        break;
      }
    }
    setInOilSlick(inSlick);

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
