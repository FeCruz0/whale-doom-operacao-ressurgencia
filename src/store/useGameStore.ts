import { create } from "zustand";

export interface TrashItem {
  id: number;
  position: [number, number, number];
  type: "toxic-barrel" | "plastic-bag" | "scrap-metal" | "plastic-bottle" | "floating-bag" | "ghost-net" | "tin-can" | "tire";
  size: number;
  hitRadius: number;
}

export interface OilSlickItem {
  id: number;
  position: [number, number, number];
  radius: number;
}

export interface ProjectileItem {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  life: number; // seconds to live
}

export interface SectionInfo {
  id: number;
  name: string;
  desc: string;
  threshold: number; // Lower bound Z
}

export const SECTIONS: SectionInfo[] = [
  { id: 1, name: "Mar Aberto (Cabo Frio)", desc: "Águas abertas de correntes frias. Começo da subida em direção à costa.", threshold: -450 },
  { id: 2, name: "Paredões do Pontal do Atalaia", desc: "Formações rochosas colossais erguendo-se em direção à luz.", threshold: -1000 },
  { id: 3, name: "Estreito do Boqueirão (Fenda de Nossa Senhora)", desc: "Garganta rochosa profunda e muito estreita. Suba com cuidado!", threshold: -1600 },
  { id: 4, name: "Águas Rasas (Arraial do Cabo)", desc: "Chegada! Águas cristalinas e rasas de Arraial do Cabo banhadas de luz.", threshold: -2200 }
];

interface GameState {
  score: number;
  lives: number;
  boost: number; // Oxygen level / stamina
  isPlaying: boolean;
  isGameOver: boolean;
  isGameWon: boolean;
  isPaused: boolean;
  trash: TrashItem[];
  projectiles: ProjectileItem[];
  lastShootTime: number;
  currentSection: number;
  sectionNotification: { title: string; desc: string; id: number } | null;
  nearShipwreck: boolean;
  
  // New properties for ecological additions
  trashCleaned: number;
  oilSlicks: OilSlickItem[];
  inOilSlick: boolean;
  oilDamageAccumulator: number;
  setInOilSlick: (inOilSlick: boolean) => void;
  
  startGame: () => void;
  resetGame: () => void;
  togglePause: () => void;
  damagePlayer: (amount: number) => void;
  shootBubble: (origin: [number, number, number], direction: [number, number, number]) => void;
  updateWorld: (delta: number) => void;
  rechargeBoost: (amount: number) => void;
  consumeBoost: (amount: number) => boolean;
  updateSection: (z: number) => void;
}

export const useGameStore = create<GameState>((set, get) => {
  // Helper to generate trash distributed across sections along the diagonal upward slope
  const generateDistributedTrash = (): TrashItem[] => {
    const initialTrash: TrashItem[] = [];
    let idCounter = 0;

    // Distribute 40 items total (10 per section)
    const distributions = [
      { zMin: -400, zMax: -50, xRange: 60, yMinOffset: -15, yMaxOffset: 15, types: ["plastic-bottle", "floating-bag"] as TrashItem["type"][] },    // Sec 1
      { zMin: -950, zMax: -500, xRange: 45, yMinOffset: -15, yMaxOffset: 15, types: ["ghost-net"] as TrashItem["type"][] },  // Sec 2
      { zMin: -1550, zMax: -1050, xRange: 15, yMinOffset: -15, yMaxOffset: 15, types: ["ghost-net"] as TrashItem["type"][] }, // Sec 3 (narrow)
      { zMin: -1950, zMax: -1650, xRange: 60, yMinOffset: -15, yMaxOffset: -5, types: ["tin-can", "tire"] as TrashItem["type"][] } // Sec 4
    ];

    distributions.forEach((dist, idx) => {
      for (let i = 0; i < 10; i++) {
        const type = dist.types[Math.floor(Math.random() * dist.types.length)];
        const size = 1.2 + Math.random() * 1.8;
        
        // Pick a random Z in the section
        const z = dist.zMin + Math.random() * (dist.zMax - dist.zMin);
        
        // Calculate sloped baseline Y
        const slopeY = -35 + (-z * 0.22);
        
        let x = (Math.random() - 0.5) * dist.xRange * 2;
        let y = slopeY + dist.yMinOffset + Math.random() * (dist.yMaxOffset - dist.yMinOffset);

        // Adjust positioning for specific items
        if (type === "ghost-net") {
          // Put ghost nets close to the canyon walls or columns
          const side = Math.random() < 0.5 ? -1 : 1;
          if (idx === 1) {
            // Section 2 columns or walls
            x = side * (35 + Math.random() * 15);
          } else {
            // Section 3 narrow canyon walls
            x = side * (16 + Math.random() * 5);
          }
          // Make ghost nets larger
          const netSize = 3.5 + Math.random() * 2.0;
          initialTrash.push({
            id: idCounter++,
            position: [x, y, z],
            type,
            size: netSize,
            hitRadius: netSize * 1.5,
          });
        } else if (type === "tin-can" || type === "tire") {
          // Lie on the seabed floor
          const floorY = -45 + (-z * 0.22);
          y = floorY + size * 0.5; // sit on ground
          initialTrash.push({
            id: idCounter++,
            position: [x, y, z],
            type,
            size,
            hitRadius: size * 1.2,
          });
        } else {
          // Standard floating bottles and bags
          initialTrash.push({
            id: idCounter++,
            position: [x, y, z],
            type,
            size,
            hitRadius: size * 1.2,
          });
        }
      }
    });

    return initialTrash;
  };

  const generateOilSlicks = (): OilSlickItem[] => {
    const slicks: OilSlickItem[] = [];
    const zPositions = [-250, -380, -700, -900, -1300, -1700, -1850];
    const xOffsets = [-15, 20, -25, 15, 0, -20, 25];
    const radii = [18, 22, 20, 25, 15, 22, 18];

    for (let i = 0; i < zPositions.length; i++) {
      const z = zPositions[i];
      const x = xOffsets[i];
      const slopeY = -35 + (-z * 0.22);
      // Floating in the water column
      const y = slopeY + 5 + Math.random() * 10;
      slicks.push({
        id: i,
        position: [x, y, z],
        radius: radii[i]
      });
    }
    return slicks;
  };

  return {
    score: 0,
    lives: 3,
    boost: 100,
    isPlaying: false,
    isGameOver: false,
    isGameWon: false,
    isPaused: false,
    trash: [],
    projectiles: [],
    lastShootTime: 0,
    currentSection: 1,
    sectionNotification: null,
    nearShipwreck: false,
    
    trashCleaned: 0,
    oilSlicks: [],
    inOilSlick: false,
    oilDamageAccumulator: 0,

    setInOilSlick: (inOilSlick) => set({ inOilSlick }),

    startGame: () => {
      set({
        score: 0,
        lives: 3,
        boost: 100,
        isPlaying: true,
        isGameOver: false,
        isGameWon: false,
        isPaused: false,
        trash: generateDistributedTrash(),
        projectiles: [],
        lastShootTime: 0,
        currentSection: 1,
        sectionNotification: {
          id: 1,
          title: SECTIONS[0].name,
          desc: SECTIONS[0].desc,
        },
        nearShipwreck: false,
        trashCleaned: 0,
        oilSlicks: generateOilSlicks(),
        inOilSlick: false,
        oilDamageAccumulator: 0,
      });
    },

    resetGame: () => {
      set({
        score: 0,
        lives: 3,
        boost: 100,
        isPlaying: false,
        isGameOver: false,
        isGameWon: false,
        isPaused: false,
        trash: [],
        projectiles: [],
        currentSection: 1,
        sectionNotification: null,
        nearShipwreck: false,
        trashCleaned: 0,
        oilSlicks: [],
        inOilSlick: false,
        oilDamageAccumulator: 0,
      });
    },

    togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

    damagePlayer: (amount) => {
      set((state) => {
        const nextLives = Math.max(0, state.lives - amount);
        if (nextLives <= 0) {
          return { lives: 0, isPlaying: false, isGameOver: true, inOilSlick: false };
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

    updateSection: (z) => {
      const { currentSection, isPlaying, isGameOver, isGameWon } = get();
      if (!isPlaying || isGameOver || isGameWon) return;

      // Find which section Z matches
      let matchedSec = SECTIONS[0];
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        if (z <= SECTIONS[i].threshold) {
          matchedSec = SECTIONS[i];
          break;
        }
      }

      // Check if we entered a new section
      if (matchedSec.id !== currentSection) {
        set({
          currentSection: matchedSec.id,
          sectionNotification: {
            id: matchedSec.id,
            title: matchedSec.name,
            desc: matchedSec.desc
          }
        });
      }

      // Check shipwreck proximity: Vapor Harlingen at Z=-1780 (Z range [-1825, -1735])
      const nearWreck = z <= -1735 && z >= -1825;
      if (nearWreck !== get().nearShipwreck) {
        set({ nearShipwreck: nearWreck });
      }

      // Win condition: Player reached the very end of the final section (Z <= -1980)
      if (z <= -1980) {
        set({
          isPlaying: false,
          isGameWon: true
        });
      }
    },

    updateWorld: (delta) => {
      const { projectiles, trash, isPaused, isPlaying, inOilSlick, lives, oilDamageAccumulator } = get();
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
      const trashCleanedCount = hitTrashIds.size;

      // 3. Process oil damage over time (lose 0.35 life / second to make it challenging but fair)
      let nextLives = lives;
      let nextAccumulator = oilDamageAccumulator;
      let nextIsPlaying: boolean = isPlaying;
      let nextIsGameOver: boolean = get().isGameOver;

      if (inOilSlick) {
        nextAccumulator += delta * 0.35;
        if (nextAccumulator >= 1.0) {
          const dmg = Math.floor(nextAccumulator);
          nextLives = Math.max(0, lives - dmg);
          nextAccumulator -= dmg;
          if (nextLives <= 0) {
            nextIsPlaying = false;
            nextIsGameOver = true;
          }
        }
      } else {
        // Decay accumulator slowly when outside
        nextAccumulator = Math.max(0, nextAccumulator - delta * 0.5);
      }

      set((state) => ({
        projectiles: activeProjectiles,
        trash: remainingTrash,
        score: state.score + scoreGain,
        trashCleaned: state.trashCleaned + trashCleanedCount,
        lives: nextLives,
        isPlaying: nextIsPlaying,
        isGameOver: nextIsGameOver,
        oilDamageAccumulator: nextAccumulator,
      }));
    }
  };
});
