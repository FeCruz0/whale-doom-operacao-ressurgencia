import { create } from "zustand";

export interface SectionInfo {
  id: number;
  name: string;
  desc: string;
  threshold: number;
}

export const SECTIONS: SectionInfo[] = [
  { id: 1, name: "Mar Aberto (Cabo Frio)", desc: "Águas abertas de correntes frias. Começo da subida em direção à costa.", threshold: -450 },
  { id: 2, name: "Paredões do Pontal do Atalaia", desc: "Formações rochosas colossais erguendo-se em direção à luz. Cuidado com as Orcas!", threshold: -1000 },
  { id: 3, name: "Estreito do Boqueirão (Fenda de Nossa Senhora)", desc: "Garganta rochosa profunda e muito estreita. Suba com cuidado!", threshold: -1600 },
  { id: 4, name: "Águas Rasas (Arraial do Cabo)", desc: "Chegada! Águas cristalinas e rasas de Arraial do Cabo banhadas de luz.", threshold: -2200 }
];

export const getRouteX = (z: number): number => {
  if (z > -450) {
    return Math.sin(z * 0.01) * 35;
  } else if (z > -1000) {
    const t = (z + 450) / -550;
    return Math.sin(z * 0.01) * 35 + t * 50;
  } else if (z > -1600) {
    return Math.sin(z * 0.015) * 15 + 40;
  } else {
    return Math.sin(z * 0.005) * 20 + 20;
  }
};


interface GameStateState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  isGameWon: boolean;
  currentSection: number;
  sectionNotification: { title: string; desc: string; id: number } | null;
  nearShipwreck: boolean;

  setPlaying: (isPlaying: boolean) => void;
  setPaused: (isPaused: boolean) => void;
  setGameOver: (isGameOver: boolean) => void;
  setGameWon: (isGameWon: boolean) => void;
  setSection: (section: number) => void;
  setSectionNotification: (notification: { title: string; desc: string; id: number } | null) => void;
  setNearShipwreck: (nearShipwreck: boolean) => void;
  togglePause: () => void;
}

export const useGameStateStore = create<GameStateState>((set) => ({
  isPlaying: false,
  isPaused: false,
  isGameOver: false,
  isGameWon: false,
  currentSection: 1,
  sectionNotification: null,
  nearShipwreck: false,

  setPlaying: (isPlaying) => set({ isPlaying }),
  setPaused: (isPaused) => set({ isPaused }),
  setGameOver: (isGameOver) => set({ isGameOver }),
  setGameWon: (isGameWon) => set({ isGameWon }),
  setSection: (currentSection) => set({ currentSection }),
  setSectionNotification: (sectionNotification) => set({ sectionNotification }),
  setNearShipwreck: (nearShipwreck) => set({ nearShipwreck }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
}));
