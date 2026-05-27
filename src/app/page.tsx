"use client";

import dynamic from "next/dynamic";
import { useGameStore } from "@/store/useGameStore";
import { Play, RotateCcw, Shield, Award, Crosshair, Eye, Info, Pause, PlayCircle, Trash2, Droplets } from "lucide-react";
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
    boost,
    isPlaying,
    isGameOver,
    isGameWon,
    isPaused,
    trash,
    startGame,
    resetGame,
    togglePause,
    currentSection,
    nearShipwreck,
    trashCleaned,
    inOilSlick,
  } = useGameStore();

  const [isLocked, setIsLocked] = useState(false);
  
  const sectionNotification = useGameStore((state) => state.sectionNotification);
  const [localNotification, setLocalNotification] = useState<{ title: string; desc: string; id: number } | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (sectionNotification) {
      setLocalNotification(sectionNotification);
      setShowNotification(true);
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [sectionNotification]);

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

      {/* OIL DAMAGE SCREEN OVERLAY */}
      {isPlaying && !isGameOver && inOilSlick && (
        <div className="absolute inset-0 pointer-events-none z-30 animate-pulse border-[12px] border-red-950/85 shadow-[inset_0_0_100px_rgba(185,28,28,0.95)] bg-red-900/5">
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 backdrop-blur-md bg-red-950/90 border border-red-500/50 rounded-full px-5 py-2 text-[10px] text-red-300 font-bold font-orbitron tracking-widest uppercase shadow-2xl">
            <Droplets className="w-4 h-4 text-red-500 animate-bounce" /> CONTAMINAÇÃO POR ÓLEO: DANIFICANDO O CASCO!
          </div>
        </div>
      )}

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
        <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm bg-slate-950/40 z-20 transition-all duration-300 pointer-events-none">
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
          {/* Section Indicator Badge */}
          <div className="backdrop-blur-md bg-slate-900/60 border border-slate-700/30 rounded-full px-4 py-1.5 text-[10px] text-cyan-300 font-bold font-orbitron tracking-widest uppercase pointer-events-auto">
            ROTA: {currentSection} / 4 — {currentSection === 1 && "Mar Aberto"}
            {currentSection === 2 && "Paredões do Pontal"}
            {currentSection === 3 && "Estreito do Boqueirão"}
            {currentSection === 4 && "Águas Rasas de Arraial"}
          </div>

          {/* Main Bottom Glass HUD */}
          <div className="backdrop-blur-md bg-slate-900/70 border border-slate-700/40 rounded-2xl p-4 w-full max-w-5xl shadow-2xl flex justify-between items-center pointer-events-auto select-none gap-4">
            {/* HUD segment: ESCUDO DO CASCO & OXIGÊNIO */}
            <div className="flex items-center gap-3 w-1/4">
              <Shield className="text-red-500 w-6 h-6 animate-pulse" />
              <div>
                <p className="text-[10px] text-red-400 font-semibold tracking-widest font-orbitron">ESTRUTURA DO CASCO</p>
                <div className="flex gap-1 mt-0.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2.5 w-6 rounded-sm border ${
                        i < lives
                          ? "bg-red-500 border-red-400 shadow-[0_0_8px_#ef4444]"
                          : "bg-slate-900/80 border-slate-800"
                      } transition-all duration-300`}
                    />
                  ))}
                </div>
                {/* Oxigênio/Stamina HUD Bar */}
                <div className="mt-1">
                  <p className="text-[8px] text-cyan-400 font-semibold tracking-wider font-orbitron uppercase">OXIGÊNIO / ENERGIA</p>
                  <div className="w-20 bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800/80 mt-0.5">
                    <div
                      className="bg-cyan-400 h-full rounded-full animate-pulse shadow-[0_0_6px_#22d3ee] transition-all duration-300"
                      style={{ width: `${boost}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* HUD segment: LIXO RECOLHIDO (Lixo Limpo) */}
            <div className="flex items-center justify-center gap-3 w-1/4 border-l border-slate-800/80 px-2">
              <Trash2 className="text-emerald-400 w-5 h-5 animate-bounce-slow" />
              <div>
                <p className="text-[10px] text-emerald-400 font-semibold tracking-widest font-orbitron">LIXO RECOLHIDO</p>
                <p className="text-xl font-bold font-orbitron text-white tracking-widest mt-0.5">
                  {String(trashCleaned).padStart(3, "0")} <span className="text-[9px] text-slate-500">LIMPO</span>
                </p>
              </div>
            </div>

            {/* HUD segment: DEBRIS DEMONS COUNT (Center target monitor) */}
            <div className="flex items-center justify-center gap-3 w-1/4 border-l border-r border-slate-800/80 px-2 text-center">
              <Crosshair className="text-amber-500 w-5 h-5 animate-spin-slow" />
              <div className="text-left">
                <span className="text-[10px] text-amber-500 font-bold font-orbitron tracking-widest">
                  POLUIÇÃO RESTANTE
                </span>
                <p className="text-xl font-black font-orbitron text-amber-400 tracking-wider mt-0.5">
                  {String(activeTrashCount).padStart(2, "0")} <span className="text-[9px] text-slate-500">DEBRIS</span>
                </p>
              </div>
            </div>

            {/* HUD segment: SCORE */}
            <div className="flex items-center justify-end gap-3 w-1/4 text-right">
              <div>
                <p className="text-[10px] text-cyan-400 font-semibold tracking-widest font-orbitron">PONTUAÇÃO DO SISTEMA</p>
                <p className="text-xl font-bold font-orbitron tracking-widest text-white mt-0.5 cyber-glow">
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
              Assuma o controle da baleia **Whale** e suba das profundezas oceânicas em direção à superfície.
              Seu canhão de bolhas de alta pressão é a única defesa contra os detritos e demônios de poluição que bloqueiam seu caminho.
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

      {/* 5. SECTION TRANSITION BANNER NOTIFICATION */}
      {showNotification && localNotification && (
        <div
          className="absolute top-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-full max-w-lg px-4"
          style={{
            transition: "all 0.5s ease-in-out",
            opacity: showNotification ? 1 : 0,
            transform: `translate(-50%, ${showNotification ? "0px" : "-20px"})`,
          }}
        >
          <div className="backdrop-blur-xl bg-slate-900/90 border-2 border-cyan-500/60 rounded-2xl p-5 shadow-[0_0_25px_rgba(6,182,212,0.3)] text-center">
            <div className="text-[10px] text-cyan-400 font-bold font-orbitron tracking-[0.2em] mb-1">
              ENTRANDO NA SEÇÃO {localNotification.id} / 4
            </div>
            <h2 className="text-xl font-black font-orbitron text-white tracking-wide uppercase mb-1">
              {localNotification.title}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {localNotification.desc}
            </p>
          </div>
        </div>
      )}

      {/* 6. GAME VICTORY SCREEN OVERLAY */}
      {isGameWon && (
        <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-md bg-slate-950/85 z-20 p-6">
          <div className="backdrop-blur-xl bg-slate-900/80 border border-emerald-500/40 rounded-3xl p-8 md:p-12 max-w-md w-full shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4 animate-bounce">
              <Award className="w-8 h-8" />
            </div>

            <h2 className="text-4xl font-extrabold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-wider mb-2">
              OPERAÇÃO CONCLUÍDA
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Você despoluiu a rota e navegou até as águas limpas de Arraial do Cabo!
            </p>

            <div className="bg-slate-950/95 border border-slate-800 rounded-2xl p-5 mb-8 flex flex-col items-center gap-2">
              <div>
                <p className="text-xs text-slate-500 font-semibold font-orbitron">PONTUAÇÃO FINAL</p>
                <p className="text-3xl font-black font-orbitron text-cyan-400 mt-1">{score}</p>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold font-orbitron rounded-xl py-4 shadow-xl shadow-emerald-500/20 transition-all duration-300 hover:scale-102 cursor-pointer group"
            >
              <RotateCcw className="w-5 h-5 group-hover:rotate-45 transition-transform" /> JOGAR NOVAMENTE
            </button>
          </div>
        </div>
      )}
      {/* 7. HISTORIC SHIPWRECK BANNER TRIGGER */}
      {isPlaying && !isGameOver && nearShipwreck && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-full max-w-xl px-4">
          <div className="backdrop-blur-xl bg-amber-950/80 border border-amber-500/50 rounded-2xl p-5 shadow-[0_0_20px_rgba(245,158,11,0.25)] text-center">
            <div className="text-[10px] text-amber-400 font-bold font-orbitron tracking-[0.2em] mb-1.5 flex justify-center items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" /> DESCOBERTA HISTÓRICA: VAPOR HARLINGEN
            </div>
            <p className="text-xs text-amber-100 leading-relaxed font-sans font-medium">
              Você está nadando pelos restos do Vapor Harlingen! Este navio cargueiro alemão afundou em 1906 após colidir com a Ilha dos Porcos. Por estar em águas muito rasas (menos de 8 metros), ele se desfez com o tempo. Hoje, suas caldeiras e chapas de ferro estão cobertas por corais-cérebro e servem de refúgio perfeito para tartarugas e filhotes de baleia descansarem das correntes do mar aberto!
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
