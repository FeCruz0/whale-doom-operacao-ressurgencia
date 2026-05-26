"use client";

import dynamic from "next/dynamic";
import { useGameStore } from "@/store/useGameStore";
import { Play, RotateCcw, Shield, Award, Zap, Compass, Pause, PlayCircle } from "lucide-react";

// Dynamically import the GameCanvas component with SSR disabled
const GameCanvas = dynamic(() => import("@/components/3d/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-cyan-400 font-orbitron select-none">
      <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="tracking-widest animate-pulse text-lg">CARREGANDO SISTEMAS DE NAVEGAÇÃO 3D...</p>
    </div>
  ),
});

export default function Home() {
  const {
    score,
    lives,
    boost,
    isPlaying,
    isGameOver,
    isPaused,
    ringsCollected,
    startGame,
    resetGame,
    togglePause,
  } = useGameStore();

  return (
    <main className="relative w-full h-full overflow-hidden bg-slate-950 select-none">
      {/* 3D Canvas Viewport */}
      <div className="absolute inset-0 w-full h-full z-0">
        <GameCanvas />
      </div>

      {/* Futuristic Glassmorphic HUD overlay (Visible during gameplay) */}
      {isPlaying && !isGameOver && (
        <div className="absolute inset-x-0 top-0 p-6 flex justify-between items-start z-10 pointer-events-none">
          {/* Top Left: Score & Rings */}
          <div className="flex gap-4 pointer-events-auto">
            <div className="backdrop-blur-md bg-slate-900/60 border border-cyan-500/30 rounded-xl px-5 py-3 shadow-lg flex items-center gap-3 cyber-glow">
              <Award className="text-cyan-400 w-6 h-6 animate-pulse" />
              <div>
                <p className="text-xs text-cyan-500 font-semibold tracking-wider font-orbitron">PONTUAÇÃO</p>
                <p className="text-2xl font-bold font-orbitron tracking-wide text-white">
                  {String(score).padStart(5, "0")}
                </p>
              </div>
            </div>

            <div className="backdrop-blur-md bg-slate-900/60 border border-emerald-500/30 rounded-xl px-5 py-3 shadow-lg flex items-center gap-3">
              <Compass className="text-emerald-400 w-6 h-6 animate-spin-slow" />
              <div>
                <p className="text-xs text-emerald-500 font-semibold tracking-wider font-orbitron">ANÉIS</p>
                <p className="text-2xl font-bold font-orbitron tracking-wide text-white">
                  {ringsCollected}
                </p>
              </div>
            </div>
          </div>

          {/* Top Center: Game Controls (Pause button) */}
          <div className="pointer-events-auto">
            <button
              onClick={togglePause}
              className="backdrop-blur-md bg-slate-900/60 hover:bg-cyan-500/20 border border-slate-700/50 hover:border-cyan-400/50 rounded-xl p-3 shadow-lg transition-all duration-300 group cursor-pointer"
            >
              {isPaused ? (
                <PlayCircle className="text-emerald-400 w-6 h-6 group-hover:scale-110 transition-transform" />
              ) : (
                <Pause className="text-cyan-400 w-6 h-6 group-hover:scale-110 transition-transform" />
              )}
            </button>
          </div>

          {/* Top Right: Lives & Boost Bar */}
          <div className="flex flex-col gap-3 items-end pointer-events-auto">
            {/* Lives Indicators */}
            <div className="backdrop-blur-md bg-slate-900/60 border border-red-500/30 rounded-xl px-5 py-3 shadow-lg flex items-center gap-3">
              <Shield className="text-red-400 w-6 h-6" />
              <div>
                <p className="text-xs text-red-400 font-semibold tracking-wider font-orbitron">ESTRUTURA (ESCUDO)</p>
                <div className="flex gap-1.5 mt-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2.5 w-6 rounded-sm border ${
                        i < lives
                          ? "bg-red-500 border-red-400 shadow-[0_0_8px_#ef4444]"
                          : "bg-slate-800/80 border-slate-700"
                      } transition-all duration-300`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Hyper-Boost indicator */}
            <div className="backdrop-blur-md bg-slate-900/60 border border-cyan-500/30 rounded-xl px-5 py-3 shadow-lg w-52">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-cyan-400 font-semibold font-orbitron tracking-wider flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-cyan-400" /> HIPER-PROPULSÃO
                </span>
                <span className="text-xs font-semibold font-orbitron text-white">{Math.round(boost)}%</span>
              </div>
              <div className="w-full bg-slate-950/80 rounded-full h-2 border border-slate-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] rounded-full transition-all duration-100"
                  style={{ width: `${boost}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Blur Overlay for Pause state */}
      {isPlaying && isPaused && !isGameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-md bg-slate-950/70 z-20 transition-all duration-300">
          <div className="backdrop-blur-xl bg-slate-900/80 border border-cyan-500/40 rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl text-center">
            <h2 className="text-4xl font-extrabold font-orbitron text-cyan-400 tracking-wider mb-2 animate-pulse">
              JOGO PAUSADO
            </h2>
            <p className="text-slate-400 text-sm mb-6">Sistemas suspensos. O propulsor e asteroides foram congelados no tempo.</p>
            <button
              onClick={togglePause}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-orbitron rounded-xl py-4 shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:scale-102 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" /> RETOMAR OPERAÇÃO
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
              Módulo WebGL Ativado
            </div>

            <h1 className="text-4xl md:text-5xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-300 to-cyan-500 tracking-wider leading-tight mb-4">
              WHALE DOOM
            </h1>
            <p className="text-sm font-orbitron text-slate-400 tracking-widest uppercase mb-8">
              OPERAÇÃO RESSURGÊNCIA
            </p>

            <p className="text-slate-300 text-sm leading-relaxed mb-8 text-center max-w-md mx-auto">
              Assuma o comando da embarcação espacial <span className="text-cyan-400 font-semibold">Whale</span>.
              Navegue através de uma fenda cósmica repleta de energia residual. Colete os anéis verdes e desvie das minas explosivas.
            </p>

            {/* Interactive Instructions */}
            <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-800 py-6 mb-8 text-left text-xs text-slate-400">
              <div>
                <p className="font-semibold text-cyan-400 mb-2 font-orbitron">CONTROLES</p>
                <ul className="space-y-1">
                  <li><kbd className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700">W</kbd> / <kbd className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700">↑</kbd> Mover para Cima</li>
                  <li><kbd className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700">S</kbd> / <kbd className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700">↓</kbd> Mover para Baixo</li>
                  <li><kbd className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700">A</kbd> / <kbd className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700">←</kbd> Mover para Esquerda</li>
                  <li><kbd className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700">D</kbd> / <kbd className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700">→</kbd> Mover para Direita</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-cyan-400 mb-2 font-orbitron">MECÂNICAS</p>
                <ul className="space-y-1">
                  <li><span className="text-emerald-400 font-semibold">Anel Verde</span>: +100 Pontos</li>
                  <li><span className="text-red-400 font-semibold">Mina Vermelha</span>: Perde 1 Vida</li>
                  <li><kbd className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700">ESPAÇO</kbd> Hiper-Propulsor</li>
                </ul>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black font-orbitron rounded-xl py-4 shadow-xl shadow-cyan-500/25 transition-all duration-300 hover:scale-103 cursor-pointer group"
            >
              <Play className="w-5 h-5 fill-slate-950 group-hover:scale-110 transition-transform" /> INICIAR MISSÃO
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
            <p className="text-slate-400 text-sm mb-6">A integridade do casco da Whale atingiu 0%. Os sistemas falharam.</p>

            {/* Score Summary Box */}
            <div className="bg-slate-950/95 border border-slate-800 rounded-2xl p-5 mb-8 flex justify-between items-center text-left">
              <div>
                <p className="text-xs text-slate-500 font-semibold font-orbitron">PONTOS OBTIDOS</p>
                <p className="text-2xl font-bold font-orbitron text-cyan-400">{score}</p>
              </div>
              <div className="text-right border-l border-slate-800 pl-6">
                <p className="text-xs text-slate-500 font-semibold font-orbitron">ANÉIS COLETADOS</p>
                <p className="text-2xl font-bold font-orbitron text-emerald-400">{ringsCollected}</p>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-bold font-orbitron rounded-xl py-4 shadow-xl shadow-red-500/20 transition-all duration-300 hover:scale-102 cursor-pointer group"
            >
              <RotateCcw className="w-5 h-5 group-hover:rotate-45 transition-transform" /> RECONECTAR NAVE
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
