"use client";

import { Stars } from "@react-three/drei";
import { Particles } from "./Particles";
import { FloatingObjects } from "./FloatingObjects";
import { Projectiles } from "./Projectiles";
import { FPSControls } from "./FPSControls";
import { RouteScenario } from "./RouteScenario";

export function GameScene() {
  return (
    <>
      {/* Dark deep-sea ocean backdrop */}
      <color attach="background" args={["#020617"]} />

      {/* Underwater depth fog */}
      <fog attach="fog" args={["#020617", 10, 160]} />

      {/* Atmospheric deep sea lighting */}
      <ambientLight intensity={0.4} color="#0891b2" /> {/* cyan water light */}
      
      {/* Dynamic sunlight rays piercing from water surface */}
      <directionalLight
        position={[20, 100, -10]}
        intensity={1.5}
        color="#a5f3fc"
        castShadow
        shadow-mapSize={[1028, 1028]}
      />
      
      {/* Bioluminescent deep water point lights */}
      <pointLight position={[0, -20, -50]} intensity={4} color="#3b82f6" />
      <pointLight position={[-40, 20, -100]} intensity={3} color="#a855f7" />

      {/* Starfield treated as bioluminescent deep-sea plankton */}
      <Stars
        radius={100}
        depth={50}
        count={1500}
        factor={6}
        saturation={0.8}
        fade
        speed={1.0}
      />

      {/* Floating plankton/bubbles particles drifting slowly */}
      <Particles count={400} />

      {/* First Person Controls */}
      <FPSControls />

      {/* Projectiles & static demons list */}
      <Projectiles />
      <FloatingObjects />
      
      {/* 3D Static Environments for 4 sections */}
      <RouteScenario />
    </>
  );
}
