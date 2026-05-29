"use client";

/**
 * AssetWarmUp - Invisible shader warm-up component.
 *
 * PURPOSE: Prevent first-frame GPU stuttering on game start.
 * Three.js compiles GLSL programs lazily (on first draw call) by default.
 * By rendering invisible geometry with every custom shader material here,
 * we force the GPU to compile them during the Menu screen — before the
 * player clicks "Jogar". This eliminates the ~100-300ms stutter that would
 * otherwise occur when the player enters the 3D scene.
 *
 * This component renders 1×1×1 pixel meshes with scale 0.0001 so they
 * are culled from the final framebuffer, but the GPU still compiles the
 * shader programs in the background.
 */

import { useMemo } from "react";
import {
  CausticsMaterial,
  BiolumRockMaterial,
  OilSlickMaterial,
} from "./materials/CustomShaders";

const INVISIBLE = [0.0001, 0.0001, 0.0001] as [number, number, number];

export function AssetWarmUp() {
  // Instantiate one instance of each custom shader material.
  // These are stable references created once — no GC pressure.
  const causticsMat = useMemo(() => new CausticsMaterial(), []);
  const biolumMat = useMemo(() => new BiolumRockMaterial(), []);
  const oilSlickMat = useMemo(() => {
    const m = new OilSlickMaterial();
    m.transparent = true;
    m.depthWrite = false;
    return m;
  }, []);

  return (
    // Invisible group — these meshes are so tiny they will never appear on screen,
    // but the GPU will still compile the shader programs during the idle Menu phase.
    <group scale={INVISIBLE} visible={false}>
      {/* Caustics warm-up */}
      <mesh>
        <planeGeometry args={[1, 1]} />
        <primitive object={causticsMat} />
      </mesh>

      {/* Bioluminescent Rock warm-up */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={biolumMat} />
      </mesh>

      {/* Oil Slick iridescence warm-up */}
      <mesh>
        <sphereGeometry args={[0.5, 4, 4]} />
        <primitive object={oilSlickMat} />
      </mesh>
    </group>
  );
}
