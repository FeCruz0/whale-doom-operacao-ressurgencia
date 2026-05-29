"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playerPositionRef } from "./FPSControls";
import { useGameStore, OrcaState } from "@/store/useGameStore";

export function OrcaEnemy() {
  const orcas = useGameStore((state) => state.orcas);
  const isPlaying = useGameStore((state) => state.isPlaying);
  const isPaused = useGameStore((state) => state.isPaused);

  const orcaRefs = useRef<THREE.Group[]>([]);


  useFrame((state) => {
    if (!isPlaying || isPaused) return;

    const time = state.clock.getElapsedTime();
    const playerPos = playerPositionRef.current;

    orcas.forEach((orca: OrcaState, i: number) => {
      const group = orcaRefs.current[i];
      if (group) {
        // Fog culling: if Orca is further than 175 units on Z axis, hide it and skip updates
        const distZ = Math.abs(orca.position[2] - playerPos.z);
        if (distZ > 175) {
          group.visible = false;
          return;
        }
        group.visible = true;

        // Sync position from game store
        group.position.set(orca.position[0], orca.position[1], orca.position[2]);


        // Tail movement animation
        const tail = group.getObjectByName("tail");
        if (tail) {
          const swaySpeed = orca.stunTimer > 0 ? 3.0 : 7.0;
          tail.rotation.y = Math.sin(time * swaySpeed) * 0.4;
        }

        // Stunned behavior: spin / tilt orca to show it's hit
        if (orca.stunTimer > 0) {
          group.rotation.x = Math.sin(time * 10) * 0.3;
          group.rotation.y = time * 8;
        } else {
          // Point Orca towards general movement direction/patrol
          group.rotation.x = 0;
          // Slowly rotate facing direction depending on Sin wave phase
          const wavePhase = Math.sin(time + i * 5);
          group.rotation.y = wavePhase > 0 ? Math.PI / 2 : -Math.PI / 2;
          group.rotation.z = 0;
        }
      }
    });
  });

  if (!isPlaying) return null;

  return (
    <group>
      {orcas.map((orca: OrcaState, index: number) => (
        <group
          key={index}
          ref={(el) => {
            if (el) orcaRefs.current[index] = el;
          }}
        >
          {/* Main Body (Stretched sphere) */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[3.2, 16, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.1} /> {/* Shiny Black */}
          </mesh>

          {/* White Belly (Slightly offset sphere) */}
          <mesh position={[0, -0.6, 0.2]} scale={[0.9, 0.6, 0.9]}>
            <sphereGeometry args={[3.0, 16, 16]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.1} /> {/* White */}
          </mesh>

          {/* White Eye Patch (Right Side) */}
          <mesh position={[1.4, 0.8, 1.8]} scale={[0.8, 0.4, 0.3]}>
            <sphereGeometry args={[1.0, 8, 8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} />
          </mesh>

          {/* White Eye Patch (Left Side) */}
          <mesh position={[-1.4, 0.8, 1.8]} scale={[0.8, 0.4, 0.3]}>
            <sphereGeometry args={[1.0, 8, 8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} />
          </mesh>

          {/* Dorsal Fin (High triangular box/cone) */}
          <mesh position={[0, 3.5, -0.5]} rotation={[-0.3, 0, 0]}>
            <coneGeometry args={[0.8, 3.2, 4]} />
            <meshStandardMaterial color="#0f172a" roughness={0.1} />
          </mesh>

          {/* Side Fins (Pectorais) */}
          {/* Left pectoral fin */}
          <mesh position={[-3.5, -0.5, 0.5]} rotation={[0.2, 0.2, -0.5]} scale={[1.8, 0.3, 1.0]}>
            <boxGeometry args={[1.0, 1.0, 1.0]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          {/* Right pectoral fin */}
          <mesh position={[3.5, -0.5, 0.5]} rotation={[0.2, -0.2, 0.5]} scale={[1.8, 0.3, 1.0]}>
            <boxGeometry args={[1.0, 1.0, 1.0]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>

          {/* Tail Group (for rotation animation) */}
          <group name="tail" position={[0, 0, -2.8]}>
            <mesh castShadow position={[0, 0, -1.5]}>
              <coneGeometry args={[1.2, 3.0, 8]} />
              <meshStandardMaterial color="#0f172a" roughness={0.15} />
            </mesh>
            {/* Tail Fin (Fluke) */}
            <mesh position={[0, 0, -3.2]} scale={[3.0, 0.2, 1.2]} rotation={[0, 0, 0]}>
              <sphereGeometry args={[0.8, 8, 8]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          </group>

          {/* Glowing Red Threat aura if chasing player (visual feedback) */}
          {orca.stunTimer <= 0 && (
            <mesh scale={[4.0, 4.0, 4.0]}>
              <sphereGeometry args={[1.1, 8, 8]} />
              <meshBasicMaterial
                color="#ef4444"
                transparent={true}
                opacity={0.1}
                wireframe={true}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
