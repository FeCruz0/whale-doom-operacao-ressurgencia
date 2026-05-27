"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";

export function OilSlicks() {
  const oilSlicks = useGameStore((state) => state.oilSlicks);
  const isPlaying = useGameStore((state) => state.isPlaying);
  const isPaused = useGameStore((state) => state.isPaused);
  
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!isPlaying || isPaused || !groupRef.current) return;
    
    const elapsedTime = state.clock.getElapsedTime();
    
    // Animate subtle expansion/contraction and bobbing to make oil feel fluid
    groupRef.current.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      if (mesh) {
        // Slow pulsing radius scale
        const pulse = 1.0 + Math.sin(elapsedTime * 1.2 + index) * 0.05;
        mesh.scale.set(pulse, pulse, 1.0);
        
        // Slow rotation
        mesh.rotation.z = elapsedTime * 0.05 * (index % 2 === 0 ? 1 : -1);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {oilSlicks.map((slick) => (
        <mesh
          key={slick.id}
          position={slick.position}
          rotation={[-Math.PI / 2, 0, 0]} // align horizontally
          receiveShadow
        >
          <circleGeometry args={[slick.radius, 32]} />
          <meshStandardMaterial
            color="#12180e" // Very dark greenish-brown oil slick
            emissive="#050803"
            roughness={0.05} // highly reflective sheen
            metalness={0.9} // slick metallic/oil feel
            transparent={true}
            opacity={0.65}
            side={THREE.DoubleSide}
            depthWrite={false} // avoid transparency sorting issues
          />
        </mesh>
      ))}
    </group>
  );
}
