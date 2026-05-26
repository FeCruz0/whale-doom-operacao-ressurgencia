import { create } from "zustand";

interface GameState {
  score: number;
  lives: number;
  boost: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  ringsCollected: number;
  speed: number;
  
  startGame: () => void;
  incrementScore: (amount: number) => void;
  decrementLives: () => void;
  useBoost: (amount: number) => boolean;
  rechargeBoost: (amount: number) => void;
  gameOver: () => void;
  togglePause: () => void;
  resetGame: () => void;
  setSpeed: (speed: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  score: 0,
  lives: 3,
  boost: 100,
  isPlaying: false,
  isGameOver: false,
  isPaused: false,
  ringsCollected: 0,
  speed: 10,

  startGame: () =>
    set({
      score: 0,
      lives: 3,
      boost: 100,
      isPlaying: true,
      isGameOver: false,
      isPaused: false,
      ringsCollected: 0,
      speed: 15,
    }),

  incrementScore: (amount) =>
    set((state) => ({
      score: state.score + amount,
      ringsCollected: state.ringsCollected + 1,
    })),

  decrementLives: () =>
    set((state) => {
      const nextLives = state.lives - 1;
      if (nextLives <= 0) {
        return { lives: 0, isPlaying: false, isGameOver: true };
      }
      return { lives: nextLives };
    }),

  useBoost: (amount) => {
    const { boost } = get();
    if (boost <= 0) return false;
    set((state) => ({ boost: Math.max(0, state.boost - amount) }));
    return true;
  },

  rechargeBoost: (amount) =>
    set((state) => ({ boost: Math.min(100, state.boost + amount) })),

  gameOver: () => set({ isPlaying: false, isGameOver: true }),
  
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  
  resetGame: () =>
    set({
      score: 0,
      lives: 3,
      boost: 100,
      isPlaying: false,
      isGameOver: false,
      isPaused: false,
      ringsCollected: 0,
      speed: 10,
    }),

  setSpeed: (speed) => set({ speed }),
}));
