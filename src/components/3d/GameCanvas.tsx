"use client";

import { Canvas } from "@react-three/fiber";
import { GameScene } from "./GameScene";

export default function GameCanvas() {
  return (
    <div className="w-full h-full relative overflow-hidden select-none">
      <Canvas
        shadows
        camera={{
          fov: 60,
          near: 0.1,
          far: 1000,
          position: [0, 4, 12],
        }}
      >
        <GameScene />
      </Canvas>
    </div>
  );
}
