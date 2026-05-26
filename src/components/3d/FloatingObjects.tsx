"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";
import { playerPositionRef } from "./Player";

interface ActiveItem {
  id: number;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  speed: number;
  rotSpeed: THREE.Vector3;
  scale: number;
}

export function FloatingObjects() {
  const isPlaying = useGameStore((state) => state.isPlaying);
  const isPaused = useGameStore((state) => state.isPaused);
  const incrementScore = useGameStore((state) => state.incrementScore);
  const decrementLives = useGameStore((state) => state.decrementLives);

  const ringsRef = useRef<THREE.Group>(null);
  const minesRef = useRef<THREE.Group>(null);

  const ringCount = 6;
  const mineCount = 8;

  // Initialize rings with random offsets ahead of the player
  const rings = useMemo<ActiveItem[]>(() => {
    return Array.from({ length: ringCount }).map((_, i) => ({
      id: i,
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 30, // X
        (Math.random() - 0.5) * 20, // Y
        -150 - i * 60 - Math.random() * 20 // Z (spaced out)
      ),
      rotation: new THREE.Euler(0, 0, 0),
      speed: 35 + Math.random() * 15,
      rotSpeed: new THREE.Vector3(0.5, 1, 0),
      scale: 1,
    }));
  }, []);

  // Initialize mines with random offsets ahead of the player
  const mines = useMemo<ActiveItem[]>(() => {
    return Array.from({ length: mineCount }).map((_, i) => ({
      id: i,
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 40, // X
        (Math.random() - 0.5) * 25, // Y
        -180 - i * 50 - Math.random() * 25 // Z (spaced out)
      ),
      rotation: new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ),
      speed: 35 + Math.random() * 15,
      rotSpeed: new THREE.Vector3(
        Math.random() * 2,
        Math.random() * 2,
        Math.random() * 2
      ),
      scale: 1.2 + Math.random() * 1.5,
    }));
  }, []);

  // Invulnerability window tracker for collision
  const invulnTimeRef = useRef(0);

  useFrame((state, delta) => {
    if (!isPlaying || isPaused) return;

    // Reduce invulnerability frame tracker
    if (invulnTimeRef.current > 0) {
      invulnTimeRef.current -= delta;
    }

    const playerPos = playerPositionRef.current;

    // 1. Move and check collision for RINGS
    if (ringsRef.current) {
      ringsRef.current.children.forEach((child, index) => {
        const ring = rings[index];
        // Move towards the screen
        child.position.z += ring.speed * delta;
        // Spin
        child.rotation.y += ring.rotSpeed.y * delta;
        child.rotation.x += ring.rotSpeed.x * delta;

        // Collision Check: Player is at Z = 0 (or close to it)
        const dist = child.position.distanceTo(playerPos);
        if (dist < 2.8) {
          // Collected!
          incrementScore(100);
          // Reset ring far ahead
          child.position.set(
            (Math.random() - 0.5) * 35,
            (Math.random() - 0.5) * 20,
            -350 - Math.random() * 100
          );
        }

        // Reset if passed behind the camera
        if (child.position.z > 15) {
          child.position.set(
            (Math.random() - 0.5) * 35,
            (Math.random() - 0.5) * 20,
            -350 - Math.random() * 100
          );
        }
      });
    }

    // 2. Move and check collision for MINES (obstacles)
    if (minesRef.current) {
      minesRef.current.children.forEach((child, index) => {
        const mine = mines[index];
        // Move towards the screen
        child.position.z += mine.speed * delta;
        // Rotate randomly
        child.rotation.x += mine.rotSpeed.x * delta;
        child.rotation.y += mine.rotSpeed.y * delta;

        // Collision Check
        const dist = child.position.distanceTo(playerPos);
        // Radius based on scale
        const collisionRadius = 1.5 + mine.scale * 0.5;
        if (dist < collisionRadius) {
          if (invulnTimeRef.current <= 0) {
            decrementLives();
            // Trigger temporary 1.5 seconds invulnerability
            invulnTimeRef.current = 1.5;
          }
          // Reset mine so it doesn't cause constant hits
          child.position.set(
            (Math.random() - 0.5) * 35,
            (Math.random() - 0.5) * 20,
            -350 - Math.random() * 100
          );
        }

        // Reset if passed behind the camera
        if (child.position.z > 15) {
          child.position.set(
            (Math.random() - 0.5) * 35,
            (Math.random() - 0.5) * 20,
            -350 - Math.random() * 100
          );
        }
      });
    }
  });

  return (
    <>
      {/* Group of Energy Rings */}
      <group ref={ringsRef}>
        {rings.map((ring) => (
          <group key={`ring-${ring.id}`} position={ring.position.toArray()}>
            {/* The Torus Ring */}
            <mesh castShadow>
              <torusGeometry args={[1.5, 0.2, 8, 24]} />
              <meshStandardMaterial
                color="#059669" // emerald dark
                emissive="#10b981" // emerald neon green
                emissiveIntensity={2.5}
                roughness={0.1}
                metalness={0.9}
              />
            </mesh>
            {/* Inner glow cylinder/flare */}
            <mesh>
              <cylinderGeometry args={[1.2, 1.2, 0.1, 16]} />
              <meshBasicMaterial
                color="#34d399"
                transparent={true}
                opacity={0.15}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Group of Spiky Space Mines / Obstacles */}
      <group ref={minesRef}>
        {mines.map((mine) => (
          <mesh
            key={`mine-${mine.id}`}
            position={mine.position.toArray()}
            scale={[mine.scale, mine.scale, mine.scale]}
            castShadow
          >
            {/* Spiky rocky obstacle shape */}
            <dodecahedronGeometry args={[0.8, 1]} />
            <meshStandardMaterial
              color="#991b1b" // dark red
              emissive="#ef4444" // bright red
              emissiveIntensity={1.5}
              roughness={0.8}
              metalness={0.2}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}
