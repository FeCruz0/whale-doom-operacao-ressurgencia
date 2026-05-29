"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import { GameScene } from "./GameScene";

function GameCanvasComponent() {
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

export default React.memo(GameCanvasComponent);

