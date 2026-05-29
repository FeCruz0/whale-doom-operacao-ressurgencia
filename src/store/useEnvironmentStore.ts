import { create } from "zustand";
import * as THREE from "three";
import { getRouteX, SECTIONS, useGameStateStore } from "./useGameStateStore";
import { usePlayerStatsStore } from "./usePlayerStatsStore";

export interface TrashItem {
  id: number;
  position: [number, number, number];
  type: "toxic-barrel" | "plastic-bag" | "scrap-metal" | "plastic-bottle" | "floating-bag" | "ghost-net" | "tin-can" | "tire";
  size: number;
  hitRadius: number;
  phaseOffset?: number;
  velocity?: [number, number, number];
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
  life: number;
}

export interface OrcaState {
  position: [number, number, number];
  patrolCenter: [number, number, number];
  speed: number;
  stunTimer: number;
  direction: [number, number, number];
}

const getObstaclesList = (z: number) => [
  { x: getRouteX(-550) - 60, z: -550, radius: 15 },
  { x: getRouteX(-800) - 50, z: -800, radius: 17 },
  { x: getRouteX(-700) + 60, z: -700, radius: 16 },
  { x: getRouteX(-950) + 55, z: -950, radius: 18 },
  { x: getRouteX(-1700) - 35, z: -1700, radius: 5 },
  { x: getRouteX(-1800) + 35, z: -1800, radius: 6 },
  { x: getRouteX(-1900) - 15, z: -1900, radius: 4 },
  { x: getRouteX(-1980) - 25, z: -1980, radius: 8 },
  { x: getRouteX(-1980) + 25, z: -1980, radius: 8 },
  { x: getRouteX(-1780) - 15, z: -1765, radius: 5 },
  { x: getRouteX(-1780) + 15, z: -1795, radius: 5 }
];

const generateDistributedTrash = (): TrashItem[] => {
  const initialTrash: TrashItem[] = [];
  let idCounter = 0;

  const distributions = [
    { zMin: -400, zMax: -50, xRange: 80, yMinOffset: -15, yMaxOffset: 25, types: ["plastic-bottle", "floating-bag"] as TrashItem["type"][] },
    { zMin: -950, zMax: -500, xRange: 70, yMinOffset: -15, yMaxOffset: 25, types: ["ghost-net", "plastic-bottle", "floating-bag"] as TrashItem["type"][] },
    { zMin: -1550, zMax: -1050, xRange: 35, yMinOffset: -15, yMaxOffset: 25, types: ["ghost-net", "toxic-barrel", "scrap-metal"] as TrashItem["type"][] }
  ];

  distributions.forEach((dist, idx) => {
    for (let i = 0; i < 30; i++) {
      const type = dist.types[Math.floor(Math.random() * dist.types.length)];
      const size = 1.0 + Math.random() * 1.6;
      const z = dist.zMin + Math.random() * (dist.zMax - dist.zMin);
      const slopeY = -35 + (-z * 0.22);
      const pathX = getRouteX(z);
      let x = pathX + (Math.random() - 0.5) * dist.xRange * 2;
      let y = slopeY + dist.yMinOffset + Math.random() * (dist.yMaxOffset - dist.yMinOffset);

      if (type === "ghost-net") {
        const side = Math.random() < 0.5 ? -1 : 1;
        if (idx === 1) {
          x = pathX + side * (35 + Math.random() * 15);
        } else {
          x = pathX + side * (16 + Math.random() * 5);
        }
        const netSize = 3.2 + Math.random() * 1.8;
        initialTrash.push({
          id: idCounter++,
          position: [x, y, z],
          type,
          size: netSize,
          hitRadius: netSize * 1.4,
          phaseOffset: Math.random() * Math.PI * 2
        });
      } else if (type === "tin-can" || type === "tire" || type === "scrap-metal") {
        const floorY = -45 + (-z * 0.22);
        y = floorY + size * 0.5;
        initialTrash.push({
          id: idCounter++,
          position: [x, y, z],
          type,
          size,
          hitRadius: size * 1.2,
          phaseOffset: Math.random() * Math.PI * 2
        });
      } else {
        initialTrash.push({
          id: idCounter++,
          position: [x, y, z],
          type,
          size,
          hitRadius: size * 1.1,
          phaseOffset: Math.random() * Math.PI * 2
        });
      }
    }
  });

  return initialTrash;
};

const generateOilSlicks = (): OilSlickItem[] => {
  const slicks: OilSlickItem[] = [];
  const zPositions = [-250, -380, -700, -900, -1300];
  const radii = [18, 22, 20, 25, 15];

  for (let i = 0; i < zPositions.length; i++) {
    const z = zPositions[i];
    const pathX = getRouteX(z);
    const x = pathX + (Math.random() - 0.5) * 15;
    const slopeY = -35 + (-z * 0.22);
    const y = slopeY + 5 + Math.random() * 12;
    slicks.push({
      id: i,
      position: [x, y, z],
      radius: radii[i]
    });
  }
  return slicks;
};

const generateOrcas = (): OrcaState[] => {
  return [
    {
      position: [getRouteX(-650), -35 + 650 * 0.22 + 10, -650],
      patrolCenter: [getRouteX(-650), -35 + 650 * 0.22 + 10, -650],
      speed: 15,
      stunTimer: 0,
      direction: [1, 0, 0]
    },
    {
      position: [getRouteX(-850), -35 + 850 * 0.22 + 15, -850],
      patrolCenter: [getRouteX(-850), -35 + 850 * 0.22 + 15, -850],
      speed: 16,
      stunTimer: 0,
      direction: [0, 0, 1]
    },
    {
      position: [getRouteX(-1350), -35 + 1350 * 0.22 + 8, -1350],
      patrolCenter: [getRouteX(-1350), -35 + 1350 * 0.22 + 8, -1350],
      speed: 18,
      stunTimer: 0,
      direction: [-1, 0, 0]
    }
  ];
};

interface EnvironmentState {
  trash: TrashItem[];
  projectiles: ProjectileItem[];
  oilSlicks: OilSlickItem[];
  orcas: OrcaState[];
  spawnTimer: number;
  inOilSlick: boolean;
  oilDamageAccumulator: number;

  setInOilSlick: (inOilSlick: boolean) => void;
  setTrash: (trash: TrashItem[]) => void;
  setProjectiles: (projectiles: ProjectileItem[]) => void;
  setOrcas: (orcas: OrcaState[]) => void;
  setOilSlicks: (oilSlicks: OilSlickItem[]) => void;
  
  generateEnvironment: () => void;
  clearEnvironment: () => void;
  updateWorld: (delta: number, playerPos: THREE.Vector3) => void;
  spawnBubble: (origin: [number, number, number], direction: [number, number, number]) => void;
}

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  trash: [],
  projectiles: [],
  oilSlicks: [],
  orcas: [],
  spawnTimer: 0,
  inOilSlick: false,
  oilDamageAccumulator: 0,

  setInOilSlick: (inOilSlick) => set({ inOilSlick }),
  setTrash: (trash) => set({ trash }),
  setProjectiles: (projectiles) => set({ projectiles }),
  setOrcas: (orcas) => set({ orcas }),
  setOilSlicks: (oilSlicks) => set({ oilSlicks }),

  generateEnvironment: () => set({
    trash: generateDistributedTrash(),
    oilSlicks: generateOilSlicks(),
    orcas: generateOrcas(),
    projectiles: [],
    spawnTimer: 0,
    inOilSlick: false,
    oilDamageAccumulator: 0
  }),

  clearEnvironment: () => set({
    trash: [],
    projectiles: [],
    oilSlicks: [],
    orcas: [],
    spawnTimer: 0,
    inOilSlick: false,
    oilDamageAccumulator: 0
  }),

  spawnBubble: (origin, direction) => {
    const now = Date.now();
    const statsStore = usePlayerStatsStore.getState();
    if (now - statsStore.lastShootTime < 200) return; // limit fire rate: 200ms

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
    }));
    usePlayerStatsStore.setState({ lastShootTime: now });
  },

  updateWorld: (delta, playerPos) => {
    const gameState = useGameStateStore.getState();
    const statsState = usePlayerStatsStore.getState();
    
    if (gameState.isPaused || !gameState.isPlaying) return;

    const { projectiles, trash, inOilSlick, oilDamageAccumulator, spawnTimer, orcas } = get();

    // Update Invincibility Timer
    const nextInvincibleTimer = Math.max(0, statsState.invincibleTimer - delta);
    usePlayerStatsStore.setState({ invincibleTimer: nextInvincibleTimer });

    // A. Dynamic trash spawn timer: drop trash from ceiling every 3.5 seconds
    let nextSpawnTimer = spawnTimer + delta;
    const spawnedTrash: TrashItem[] = [];
    if (nextSpawnTimer >= 3.5) {
      nextSpawnTimer = 0;
      const countToSpawn = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < countToSpawn; i++) {
        const spawnZ = Math.max(-1950, Math.min(30, playerPos.z + (Math.random() - 0.5) * 150));
        const spawnX = getRouteX(spawnZ) + (Math.random() - 0.5) * 60;
        const ceilingY = -35 + (-spawnZ * 0.22) + 60; // top surface
        const type = Math.random() < 0.6 ? "plastic-bottle" : "floating-bag";
        const size = 1.0 + Math.random() * 1.5;
        
        spawnedTrash.push({
          id: Date.now() + Math.random(),
          position: [spawnX, ceilingY, spawnZ],
          type,
          size,
          hitRadius: size * 1.1,
          phaseOffset: Math.random() * Math.PI * 2,
          velocity: [0, -10 - Math.random() * 10, 0] // fall straight down
        });
      }
    }

    // B. Move falling spawned trash, applying physics (ground colision & cylinder obstacle sliding)
    const updatedTrash: TrashItem[] = [];
    for (const t of trash) {
      if (t.velocity) {
        let nextX = t.position[0];
        const nextY = t.position[1] + t.velocity[1] * delta;
        let nextZ = t.position[2];
        
        const obsList = getObstaclesList(nextZ);
        for (const obs of obsList) {
          const dx = nextX - obs.x;
          const dz = nextZ - obs.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          const minDist = obs.radius + t.size * 0.6;
          if (dist < minDist) {
            const overlap = minDist - dist;
            nextX += (dx / (dist || 1)) * overlap;
            nextZ += (dz / (dist || 1)) * overlap;
          }
        }

        const seabedY = -45 + (-nextZ * 0.22);
        if (nextY <= seabedY) {
          updatedTrash.push({
            ...t,
            position: [nextX, seabedY + t.size * 0.5, nextZ],
            velocity: undefined
          });
        } else {
          updatedTrash.push({
            ...t,
            position: [nextX, nextY, nextZ]
          });
        }
      } else {
        updatedTrash.push(t);
      }
    }
    
    const totalTrash = updatedTrash.concat(spawnedTrash);

    // C. Move and decay projectiles, check collision with trash & orcas
    const activeProjectiles: ProjectileItem[] = [];
    const hitTrashIds = new Set<number>();
    const stunOrcaIndices = new Set<number>();
    const orcaKnockbacks: [number, number, number][] = orcas.map(() => [0, 0, 0]);

    for (const proj of projectiles) {
      const nextLife = proj.life - delta;
      if (nextLife <= 0) continue;

      const nextPos: [number, number, number] = [
        proj.position[0] + proj.velocity[0] * delta,
        proj.position[1] + proj.velocity[1] * delta,
        proj.position[2] + proj.velocity[2] * delta,
      ];

      let hit = false;
      
      // SPATIAL SWEEP: Only check trash collision with active elements within a local 45m Z-window
      const localTrash = totalTrash.filter((t) => Math.abs(t.position[2] - nextPos[2]) < 45.0);
      
      for (const t of localTrash) {
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
        for (let oi = 0; oi < orcas.length; oi++) {
          const orca = orcas[oi];
          // Proximity filter for Orcas
          if (Math.abs(orca.position[2] - nextPos[2]) > 50.0) continue;
          
          const dx = nextPos[0] - orca.position[0];
          const dy = nextPos[1] - orca.position[1];
          const dz = nextPos[2] - orca.position[2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (dist < 12.0) {
            hit = true;
            stunOrcaIndices.add(oi);
            const normX = dx / (dist || 1);
            const normY = dy / (dist || 1);
            const normZ = dz / (dist || 1);
            orcaKnockbacks[oi] = [normX * 25, normY * 15, normZ * 25];
            break;
          }
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

    const remainingTrash = totalTrash.filter((t) => !hitTrashIds.has(t.id));
    const scoreGain = hitTrashIds.size * 150;
    const trashCleanedCount = hitTrashIds.size;

    // D. Orca AI Behavior with sliding physical obstacle resolution
    const updatedOrcas: OrcaState[] = orcas.map((orca, index) => {
      let nextStun = Math.max(0, orca.stunTimer - delta);
      if (stunOrcaIndices.has(index)) {
        nextStun = 3.0;
      }

      let oPos = [...orca.position] as [number, number, number];
      
      const kb = orcaKnockbacks[index];
      oPos[0] += kb[0] * delta;
      oPos[1] += kb[1] * delta;
      oPos[2] += kb[2] * delta;

      if (nextStun <= 0) {
        const dx = playerPos.x - oPos[0];
        const dy = playerPos.y - oPos[1];
        const dz = playerPos.z - oPos[2];
        const distToPlayer = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distToPlayer < 45.0) {
          const dirX = dx / distToPlayer;
          const dirY = dy / distToPlayer;
          const dirZ = dz / distToPlayer;
          oPos[0] += dirX * orca.speed * 1.5 * delta;
          oPos[1] += dirY * orca.speed * 1.5 * delta;
          oPos[2] += dirZ * orca.speed * 1.5 * delta;
        } else {
          const time = Date.now() * 0.001;
          const targetX = orca.patrolCenter[0] + Math.sin(time + index * 5) * 40;
          const diffX = targetX - oPos[0];
          const stepX = Math.sign(diffX) * orca.speed * delta;
          oPos[0] += Math.abs(diffX) < Math.abs(stepX) ? diffX : stepX;
          oPos[1] = orca.patrolCenter[1] + Math.sin(time * 2 + index) * 2;
        }
      } else {
        oPos[0] -= orca.direction[0] * orca.speed * 0.5 * delta;
        oPos[2] -= orca.direction[2] * orca.speed * 0.5 * delta;
      }

      const floorY = -45 + (-oPos[2] * 0.22);
      oPos[1] = Math.max(floorY + 4.0, Math.min(oPos[1], floorY + 55.0));

      const obsList = getObstaclesList(oPos[2]);
      for (const obs of obsList) {
        const dx = oPos[0] - obs.x;
        const dz = oPos[2] - obs.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const minDist = obs.radius + 5.0;
        if (dist < minDist) {
          const overlap = minDist - dist;
          oPos[0] += (dx / (dist || 1)) * overlap;
          oPos[2] += (dz / (dist || 1)) * overlap;
        }
      }

      return {
        ...orca,
        position: oPos as [number, number, number],
        stunTimer: nextStun
      };
    });

    // E. Check Orca damage collision with player
    let hitByOrca = false;
    if (nextInvincibleTimer <= 0) {
      for (const orca of updatedOrcas) {
        if (orca.stunTimer > 0) continue;
        const dx = playerPos.x - orca.position[0];
        const dy = playerPos.y - orca.position[1];
        const dz = playerPos.z - orca.position[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 6.5) {
          hitByOrca = true;
          // Trigger smartphone collision vibration feedback
          if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate([150, 100, 150]);
          }
          break;
        }
      }
    }

    // F. Surface healing & breathing
    const floorY = -45 + (-playerPos.z * 0.22);
    const maxPlayerY = floorY + 68.0;
    const isNearSurface = playerPos.y >= maxPlayerY - 6.0;

    let nextLives = statsState.lives;
    let nextBoost = statsState.boost;
    let nextIsSurfacing = false;

    if (isNearSurface) {
      nextIsSurfacing = true;
      nextBoost = Math.min(100, statsState.boost + delta * 20.0);
      
      if (statsState.lives < 3) {
        const healProgress = (statsState as any).surfaceHealProgress || 0;
        const nextHealProgress = healProgress + delta;
        if (nextHealProgress >= 2.5) {
          nextLives = Math.min(3, statsState.lives + 1);
          usePlayerStatsStore.setState({ surfaceHealProgress: 0 } as any);
        } else {
          usePlayerStatsStore.setState({ surfaceHealProgress: nextHealProgress } as any);
        }
      } else {
        usePlayerStatsStore.setState({ surfaceHealProgress: 0 } as any);
      }
    } else {
      usePlayerStatsStore.setState({ surfaceHealProgress: 0 } as any);
    }

    // G. Process oil damage over time
    let nextAccumulator = oilDamageAccumulator;
    let nextIsPlaying: boolean = gameState.isPlaying;
    let nextIsGameOver: boolean = gameState.isGameOver;


    if (inOilSlick && nextInvincibleTimer <= 0) {
      nextAccumulator += delta * 0.35;
      if (nextAccumulator >= 1.0) {
        const dmg = Math.floor(nextAccumulator);
        nextLives = Math.max(0, nextLives - dmg);
        nextAccumulator -= dmg;
        usePlayerStatsStore.setState({ invincibleTimer: 1.0 });
      }
    } else {
      nextAccumulator = Math.max(0, nextAccumulator - delta * 0.5);
    }

    // Deduct Orca damage if hit
    let newInvincibleTimer = nextInvincibleTimer;
    if (hitByOrca) {
      nextLives = Math.max(0, nextLives - 1);
      newInvincibleTimer = 1.8;
    }

    if (nextLives <= 0) {
      nextIsPlaying = false;
      nextIsGameOver = true;
    }

    // Sync all Stores
    usePlayerStatsStore.setState({
      lives: nextLives,
      boost: nextBoost,
      invincibleTimer: newInvincibleTimer,
      isSurfacing: nextIsSurfacing,
      trashCleaned: statsState.trashCleaned + trashCleanedCount,
    });
    usePlayerStatsStore.getState().addScore(scoreGain);

    useGameStateStore.setState({
      isPlaying: nextIsPlaying,
      isGameOver: nextIsGameOver
    });

    set({
      projectiles: activeProjectiles,
      trash: remainingTrash,
      oilDamageAccumulator: nextAccumulator,
      spawnTimer: nextSpawnTimer,
      orcas: updatedOrcas,
    });
  }
}));
