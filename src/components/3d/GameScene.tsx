"use client";

import { Stars } from "@react-three/drei";
import { Particles } from "./Particles";
import { Player } from "./Player";
import { FloatingObjects } from "./FloatingObjects";

export function GameScene() {
  return (
    <>
      {/* Dark space/deep-sea background color */}
      <color attach="background" args={["#030712"]} />

      {/* Fog to hide pop-in of obstacles and rings beautifully */}
      <fog attach="fog" args={["#030712", 100, 320]} />

      {/* Atmospheric lighting */}
      <ambientLight intensity={0.2} color="#0e7490" /> {/* cyan/blue ambience */}
      
      {/* Main directional light representing a distant star or neon gate glow */}
      <directionalLight
        position={[10, 20, 20]}
        intensity={1.2}
        color="#a5f3fc"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* Subtle purple point light for color complexity */}
      <pointLight position={[-20, 10, -50]} intensity={3} color="#a855f7" />

      {/* Background Starfield (Drei's highly optimized component) */}
      <Stars
        radius={150}
        depth={60}
        count={2500}
        factor={7}
        saturation={0.5}
        fade
        speed={1.5}
      />

      {/* Forward Speed Particles (bubbles/cosmic dust) */}
      <Particles count={600} />

      {/* Dynamic 3D Entities */}
      <Player />
      <FloatingObjects />
    </>
  );
}
