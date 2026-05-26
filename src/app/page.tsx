"use client";

import dynamic from "next/dynamic";
import { useGameStore } from "@/store/useGameStore";
import { Play, RotateCcw, Shield, Award, Crosshair, Eye, Info, Pause, PlayCircle } from "lucide-react";
import { useState, useEffect } from "react";

// Dynamically import the GameCanvas component with SSR disabled
const GameCanvas = dynamic(() => import("@/components/3d/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-cyan-400 font-orbitron select-none">
      <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="tracking-widest animate-pulse text-lg">CARREGANDO CANHÃO DE BOLHAS 3D...</p>
    </div>
  ),
});

export default function Home() {
  const {
    score,
    lives,
    isPlaying,
    isGameOver,
    isPaused,
    trash,
    startGame,
    resetGame,
    togglePause,
  } = useGameStore();

  const [isLocked, setIsLocked] = useState(false);

  // Sync state checking if PointerLock is active
  useEffect(() => {
    const handleLockChange = () => {
      if (document.pointerLockElement !== null) {
        setIsLocked(true);
        useGameStore.setState({ isPaused: false });
      } else {
        setIsLocked(false);
        if (useGameStore.getState().isPlaying) {
          useGameStore.setState({ isPaused: true });
        }
      }
    };

    document.addEventListener("pointerlockchange", handleLockChange);
    return () => {
      document.removeEventListener("pointerlockchange", handleLockChange);
    };
  }, []);

  const activeTrashCount = trash.length;

  return (
    <main className="relative w-full h-full overflow-hidden bg-slate-950 select-none">
      {/* 3D Canvas Viewport */}
      <div className="absolute inset-0 w-full h-full z-0">
        <GameCanvas />
      </div>

      {/* 1. FPS CROSSHAIR (Only visible during gameplay and when pointer is locked) */}
      {isPlaying && !isGameOver && isLocked && !isPaused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          {/* Futuristic crosshair reticle */}
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"></div>
            <div className="absolute w-4 h-[1.5px] bg-cyan-400/70 left-0"></div>
            <div className="absolute w-4 h-[1.5px] bg-cyan-400/70 right-0"></div>
            <div className="absolute w-[1.5px] h-4 bg-cyan-400/70 top-0"></div>
            <div className="absolute w-[1.5px] h-4 bg-cyan-400/70 bottom-0"></div>
          </div>
        </div>
      )}

      {/* 2. POINTER LOCK INSTRUCTION OVERLAY (Visible when playing but mouse not locked) */}
      {isPlaying && !isGameOver && !isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm bg-slate-950/40 z-20 transition-all duration-300">
          <div className="backdrop-blur-xl bg-slate-900/80 border border-cyan-500/40 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
            <Eye className="text-cyan-400 w-12 h-12 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-bold font-orbitron text-white mb-2">TELA DESCONECTADA</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Clique em qualquer lugar da tela para travar o cursor do mouse e assumir o controle de mira 360° da baleia.
            </p>
            <div className="text-[10px] text-cyan-500 font-semibold tracking-wider font-orbitron animate-bounce">
              CLIQUE NA TELA PARA RETOMAR A MIRA
            </div>
          </div>
        </div>
      )}

      {/* 3. FIRST PERSON HUD DASHBOARD (Doom-style, bottom layout) */}
      {isPlaying && !isGameOver && (
        <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col items-center gap-4 z-10 pointer-events-none">
          {/* Main Bottom Glass HUD */}
          <div className="backdrop-blur-md bg-slate-900/70 border border-slate-700/40 rounded-2xl p-4 w-full max-w-4xl shadow-2xl flex justify-between items-center pointer-events-auto select-none">
            {/* HUD segment: ESCUDO DO CASCO */}
            <div className="flex items-center gap-3 w-1/3">
              <Shield className="text-red-500 w-6 h-6 animate-pulse" />
              <div>
                <p className="text-[10px] text-red-400 font-semibold tracking-widest font-orbitron">ESTRUTURA DO CASCO</p>
                <div className="flex gap-1.5 mt-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-3 w-8 rounded-sm border ${
                        i < lives
                          ? "bg-red-500 border-red-400 shadow-[0_0_8px_#ef4444]"
                          : "bg-slate-900/80 border-slate-800"
                      } transition-all duration-300`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* HUD segment: DEBRIS DEMONS COUNT (Center target monitor) */}
            <div className="flex flex-col items-center justify-center w-1/3 text-center border-l border-r border-slate-800/80 px-4">
              <span className="text-[10px] text-emerald-400 font-bold font-orbitron tracking-widest flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5 fill-emerald-500 animate-spin-slow" /> POLUIÇÃO RESTANTE
              </span>
              <p className="text-2xl font-black font-orbitron text-emerald-400 tracking-wider mt-1 animate-pulse">
                {String(activeTrashCount).padStart(2, "0")} <span className="text-xs text-slate-500">DEBRIS</span>
              </p>
            </div>

            {/* HUD segment: SCORE */}
            <div className="flex items-center justify-end gap-3 w-1/3 text-right">
              <div>
                <p className="text-[10px] text-cyan-400 font-semibold tracking-widest font-orbitron">PONTUAÇÃO DO SISTEMA</p>
                <p className="text-2xl font-bold font-orbitron tracking-widest text-white mt-1 cyber-glow">
                  {String(score).padStart(6, "0")}
                </p>
              </div>
              <Award className="text-cyan-400 w-6 h-6" />
            </div>
          </div>

          {/* Quick HUD guide tip */}
          <div className="text-[10px] text-slate-500 font-orbitron tracking-wider flex items-center gap-1">
            <Info className="w-3 h-3 text-cyan-500" /> [WASD] Mover | [ESPAÇO] Subir | [SHIFT] Descer | [CLIQUE] Atirar Bolha | [ESC] Destravar Mira
          </div>
        </div>
      )}

      {/* Screen Blur Overlay for Pause state */}
      {isPlaying && isPaused && isLocked && !isGameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-md bg-slate-950/70 z-20 transition-all duration-300">
          <div className="backdrop-blur-xl bg-slate-900/80 border border-cyan-500/40 rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl text-center">
            <h2 className="text-4xl font-extrabold font-orbitron text-cyan-400 tracking-wider mb-2 animate-pulse">
              SIMULAÇÃO SUSPENSA
            </h2>
            <p className="text-slate-400 text-sm mb-6">Operação pausada. O canhão e os resíduos estão suspensos no tempo.</p>
            <button
              onClick={togglePause}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-orbitron rounded-xl py-4 shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:scale-102 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" /> RETOMAR COMBATE
            </button>
          </div>
        </div>
      )}

      {/* Start Screen Menu Overlay */}
      {!isPlaying && !isGameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-radial from-slate-900/50 to-slate-950/90 z-20 p-6">
          <div className="backdrop-blur-xl bg-slate-900/70 border border-cyan-500/30 rounded-3xl p-8 md:p-12 max-w-xl w-full shadow-2xl text-center">
            {/* Cyberpunk branding */}
            <div className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-400/30 rounded-full text-cyan-400 text-xs font-orbitron tracking-widest uppercase mb-4 animate-pulse">
              MÓDULO FPS UNDERWATER ATIVADO
            </div>

            <h1 className="text-4xl md:text-5xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-300 to-cyan-500 tracking-wider leading-tight mb-2">
              WHALE DOOM
            </h1>
            <p className="text-sm font-orbitron text-slate-400 tracking-widest uppercase mb-8">
              OPERAÇÃO DE LIMPEZA PROFUNDA
            </p>

            <p className="text-slate-300 text-sm leading-relaxed mb-8 text-center max-w-md mx-auto">
              Assuma a visão dos olhos da embarcação **Whale** e nade livremente em 3D.
              Seu canhão de bolhas pressurizadas é a única arma contra os demônios de poluição que infestam a fenda submarina.
            </p>

            {/* FPV Controls Guidelines */}
            <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-800 py-6 mb-8 text-left text-xs text-slate-400">
              <div>
                <p className="font-semibold text-cyan-400 mb-2 font-orbitron">MIRA & DESLOCAMENTO</p>
                <ul className="space-y-1.5">
                  <li><span className="text-slate-300 font-semibold">Mouse</span>: Controla a Mira 360°</li>
                  <li><kbd className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700 font-sans">W A S D</kbd>: Natação Plana</li>
                  <li><kbd className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700 font-sans">ESPAÇO</kbd>: Nadar para Cima</li>
                  <li><kbd className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700 font-sans">SHIFT</kbd>: Nadar para Baixo</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-cyan-400 mb-2 font-orbitron">MECÂNICAS DO COMBATE</p>
                <ul className="space-y-1.5">
                  <li><span className="text-cyan-400 font-semibold font-sans">CLIQUE MOUSE</span>: Atirar Bolha</li>
                  <li><span className="text-emerald-400 font-semibold">Demônios de Lixo</span>: Ficam estáticos esperando destruição</li>
                  <li><span className="text-red-400 font-semibold">Dano</span>: Tocar nos detritos danifica o casco</li>
                </ul>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black font-orbitron rounded-xl py-4 shadow-xl shadow-cyan-500/25 transition-all duration-300 hover:scale-103 cursor-pointer group"
            >
              <Play className="w-5 h-5 fill-slate-950 group-hover:scale-110 transition-transform" /> INICIAR LIMPEZA (FPV)
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen Overlay */}
      {isGameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-md bg-slate-950/85 z-20 p-6">
          <div className="backdrop-blur-xl bg-slate-900/80 border border-red-500/40 rounded-3xl p-8 md:p-12 max-w-md w-full shadow-2xl text-center">
            {/* Warning indicator */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 mb-4 animate-bounce">
              <Shield className="w-8 h-8" />
            </div>

            <h2 className="text-4xl font-extrabold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 tracking-wider mb-2">
              MISSÃO FRACASSADA
            </h2>
            <p className="text-slate-400 text-sm mb-6">A baleia Whale colidiu em excesso. O casco colapsou.</p>

            {/* Score Summary Box */}
            <div className="bg-slate-950/95 border border-slate-800 rounded-2xl p-5 mb-8 flex flex-col items-center gap-2">
              <div>
                <p className="text-xs text-slate-500 font-semibold font-orbitron">PONTUAÇÃO DE SISTEMA</p>
                <p className="text-3xl font-black font-orbitron text-cyan-400 mt-1">{score}</p>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-bold font-orbitron rounded-xl py-4 shadow-xl shadow-red-500/20 transition-all duration-300 hover:scale-102 cursor-pointer group"
            >
              <RotateCcw className="w-5 h-5 group-hover:rotate-45 transition-transform" /> RECONECTAR EQUIPAMENTO
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
