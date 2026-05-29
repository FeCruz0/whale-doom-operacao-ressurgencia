import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlayerStatsState {
  score: number;
  highScore: number;
  lives: number;
  boost: number;
  trashCleaned: number;
  lastShootTime: number;
  invincibleTimer: number;
  isSurfacing: boolean;

  setScore: (score: number) => void;
  setLives: (lives: number) => void;
  setBoost: (boost: number) => void;
  setTrashCleaned: (trashCleaned: number) => void;
  setLastShootTime: (lastShootTime: number) => void;
  setInvincibleTimer: (invincibleTimer: number) => void;
  setSurfacing: (isSurfacing: boolean) => void;
  
  damagePlayer: (amount: number, invincibleTimerActive: boolean) => void;
  rechargeBoost: (amount: number) => void;
  consumeBoost: (amount: number) => boolean;
  addScore: (amount: number) => void;
  resetStats: () => void;
}

export const usePlayerStatsStore = create<PlayerStatsState>()(
  persist(
    (set, get) => ({
      score: 0,
      highScore: 0,
      lives: 3,
      boost: 100,
      trashCleaned: 0,
      lastShootTime: 0,
      invincibleTimer: 0,
      isSurfacing: false,

      setScore: (score) => set((state) => {
        const nextHighScore = score > state.highScore ? score : state.highScore;
        return { score, highScore: nextHighScore };
      }),
      setLives: (lives) => set({ lives }),
      setBoost: (boost) => set({ boost }),
      setTrashCleaned: (trashCleaned) => set({ trashCleaned }),
      setLastShootTime: (lastShootTime) => set({ lastShootTime }),
      setInvincibleTimer: (invincibleTimer) => set({ invincibleTimer }),
      setSurfacing: (isSurfacing) => set({ isSurfacing }),

      damagePlayer: (amount, invincibleTimerActive) => {
        const { invincibleTimer } = get();
        if (invincibleTimer > 0 && invincibleTimerActive) return; // Immune to damage

        set((state) => {
          const nextLives = Math.max(0, state.lives - amount);
          return {
            lives: nextLives,
            invincibleTimer: nextLives > 0 ? 1.5 : 0 // 1.5s invincibility
          };
        });
      },

      rechargeBoost: (amount) => set((state) => ({ boost: Math.min(100, state.boost + amount) })),
      
      consumeBoost: (amount) => {
        const { boost } = get();
        if (boost < amount) return false;
        set((state) => ({ boost: Math.max(0, state.boost - amount) }));
        return true;
      },

      addScore: (amount) => set((state) => {
        const nextScore = state.score + amount;
        return {
          score: nextScore,
          highScore: nextScore > state.highScore ? nextScore : state.highScore
        };
      }),

      resetStats: () => set(() => ({
        score: 0,
        lives: 3,
        boost: 100,
        trashCleaned: 0,
        lastShootTime: 0,
        invincibleTimer: 0,
        isSurfacing: false
      }))
    }),
    {
      name: "whale-doom-player-stats",
      partialize: (state) => ({ highScore: state.highScore }), // only persist highScore!
    }
  )
);
