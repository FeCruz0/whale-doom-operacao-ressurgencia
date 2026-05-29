"use client";

import { Stars } from "@react-three/drei";
import { Particles } from "./Particles";
import { FloatingObjects } from "./FloatingObjects";
import { Projectiles } from "./Projectiles";
import { FPSControls } from "./FPSControls";
import { RouteScenario } from "./RouteScenario";
import { OilSlicks } from "./OilSlicks";
import { OrcaEnemy } from "./OrcaEnemy";
import { GuidingSchool } from "./GuidingSchool";
import { AssetWarmUp } from "./AssetWarmUp";

export function GameScene() {
  return (
    <>
      {/* Shader Warm-Up: pre-compiles all custom GLSL shaders on the GPU
           during the Menu screen to prevent first-frame stutter on game start. */}
      <AssetWarmUp />

      {/* Dark deep-sea ocean backdrop */}
      <color attach="background" args={["#020617"]} />

      {/* Underwater depth fog */}
      <fog attach="fog" args={["#020617", 10, 160]} />

      {/* Atmospheric deep sea lighting — low ambient, cool-blue tinted */}
      <ambientLight intensity={0.28} color="#88aabb" /> {/* muted ocean ambient */}
      
      {/* Dynamic sunlight rays piercing from water surface */}
      <directionalLight
        position={[20, 100, -10]}
        intensity={1.2}
        color="#c8e8f0"
        castShadow
        shadow-mapSize={[1028, 1028]}
      />


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
      <OilSlicks />
      
      {/* Orca Predators and Guiding School */}
      <OrcaEnemy />
      <GuidingSchool />
      
      {/* 3D Static Environments for 4 sections */}
      <RouteScenario />
    </>
  );
}
