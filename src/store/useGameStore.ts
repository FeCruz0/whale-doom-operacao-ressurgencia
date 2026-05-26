import { create } from "zustand";

export interface TrashItem {
  id: number;
  position: [number, number, number];
  type: "toxic-barrel" | "plastic-bag" | "scrap-metal";
  size: number;
  hitRadius: number;
}

export interface ProjectileItem {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  life: number; // seconds to live
}

interface GameState {
  score: number;
  lives: number;
  boost: number; // Oxygen level / stamina
  isPlaying: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  trash: TrashItem[];
  projectiles: ProjectileItem[];
  lastShootTime: number;
  
  startGame: () => void;
  resetGame: () => void;
  togglePause: () => void;
  damagePlayer: (amount: number) => void;
  shootBubble: (origin: [number, number, number], direction: [number, number, number]) => void;
  updateWorld: (delta: number) => void;
  rechargeBoost: (amount: number) => void;
  consumeBoost: (amount: number) => boolean;
}

export const useGameStore = create<GameState>((set, get) => ({
  score: 0,
  lives: 3,
  boost: 100,
  isPlaying: false,
  isGameOver: false,
  isPaused: false,
  trash: [],
  projectiles: [],
  lastShootTime: 0,

  startGame: () => {
    // Generate 35 pieces of static marine debris in a deep sea arena
    const initialTrash: TrashItem[] = [];
    const types: TrashItem["type"][] = ["toxic-barrel", "plastic-bag", "scrap-metal"];

    for (let i = 0; i < 35; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const size = 1.0 + Math.random() * 2.0;
      initialTrash.push({
        id: i,
        // Spread items in a massive arena: X [-70, 70], Y [-40, 40], Z [-180, 20]
        position: [
          (Math.random() - 0.5) * 140,
          (Math.random() - 0.5) * 80,
          (Math.random() - 0.5) * 200 - 40,
        ],
        type,
        size,
        hitRadius: size * 1.2,
      });
    }

    set({
      score: 0,
      lives: 3,
      boost: 100,
      isPlaying: true,
      isGameOver: false,
      isPaused: false,
      trash: initialTrash,
      projectiles: [],
      lastShootTime: 0,
    });
  },

  resetGame: () => {
    set({
      score: 0,
      lives: 3,
      boost: 100,
      isPlaying: false,
      isGameOver: false,
      isPaused: false,
      trash: [],
      projectiles: [],
    });
  },

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  damagePlayer: (amount) => {
    set((state) => {
      const nextLives = Math.max(0, state.lives - amount);
      if (nextLives <= 0) {
        return { lives: 0, isPlaying: false, isGameOver: true };
      }
      return { lives: nextLives };
    });
  },

  shootBubble: (origin, direction) => {
    const now = Date.now();
    if (now - get().lastShootTime < 200) return; // limit fire rate: 200ms

    const speed = 70; // High velocity bubbles
    const newProjectile: ProjectileItem = {
      id: now + Math.random(),
      position: [...origin],
      velocity: [
        direction[0] * speed,
        direction[1] * speed,
        direction[2] * speed,
      ],
      life: 2.0, // 2 seconds life range
    };

    set((state) => ({
      projectiles: [...state.projectiles, newProjectile],
      lastShootTime: now,
    }));
  },

  rechargeBoost: (amount) => set((state) => ({ boost: Math.min(100, state.boost + amount) })),

  consumeBoost: (amount) => {
    const { boost } = get();
    if (boost < amount) return false;
    set((state) => ({ boost: Math.max(0, state.boost - amount) }));
    return true;
  },

  updateWorld: (delta) => {
    const { projectiles, trash, isPaused, isPlaying } = get();
    if (isPaused || !isPlaying) return;

    // 1. Move and decay projectiles
    const activeProjectiles: ProjectileItem[] = [];
    const hitTrashIds = new Set<number>();

    for (const proj of projectiles) {
      const nextLife = proj.life - delta;
      if (nextLife <= 0) continue;

      // Update position
      const nextPos: [number, number, number] = [
        proj.position[0] + proj.velocity[0] * delta,
        proj.position[1] + proj.velocity[1] * delta,
        proj.position[2] + proj.velocity[2] * delta,
      ];

      // Check collision against all active trash items
      let hit = false;
      for (const t of trash) {
        if (hitTrashIds.has(t.id)) continue;

        const dx = nextPos[0] - t.position[0];
        const dy = nextPos[1] - t.position[1];
        const dz = nextPos[2] - t.position[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < t.hitRadius) {
          hit = true;
          hitTrashIds.add(t.id);
          break;
        }
      }

      if (!hit) {
        activeProjectiles.push({
          ...proj,
          position: nextPos,
          life: nextLife,
        });
      }
    }

    // 2. Filter remaining active trash items
    const remainingTrash = trash.filter((t) => !hitTrashIds.has(t.id));
    const scoreGain = hitTrashIds.size * 150; // 150 pts per trash destroyed

    // If all trash is destroyed, spawn a new fresh wave
    let nextTrash = remainingTrash;
    if (remainingTrash.length === 0 && isPlaying) {
      const types: TrashItem["type"][] = ["toxic-barrel", "plastic-bag", "scrap-metal"];
      for (let i = 0; i < 35; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const size = 1.0 + Math.random() * 2.0;
        nextTrash.push({
          id: i + Date.now(),
          position: [
            (Math.random() - 0.5) * 140,
            (Math.random() - 0.5) * 80,
            (Math.random() - 0.5) * 200 - 40,
          ],
          type,
          size,
          hitRadius: size * 1.2,
        });
      }
    }

    set((state) => ({
      projectiles: activeProjectiles,
      trash: nextTrash,
      score: state.score + scoreGain,
    }));
  }
}));
