import { useGameStateStore, SECTIONS, getRouteX } from "./useGameStateStore";
import { usePlayerStatsStore } from "./usePlayerStatsStore";
import { useEnvironmentStore } from "./useEnvironmentStore";
import * as THREE from "three";

export { SECTIONS, getRouteX };
export type { TrashItem, OilSlickItem, ProjectileItem, OrcaState } from "./useEnvironmentStore";


interface UseGameStore {
  (selector?: (state: any) => any): any;
  getState: () => any;
  setState: (updater: any) => void;
}

export const useGameStore: UseGameStore = ((selector?: (state: any) => any) => {
  const gameState = useGameStateStore();
  const playerStats = usePlayerStatsStore();
  const environment = useEnvironmentStore();

  const combined = {
    ...gameState,
    ...playerStats,
    ...environment,
    startGame: () => {
      useGameStateStore.setState({
        isPlaying: true,
        isGameOver: false,
        isGameWon: false,
        isPaused: false,
        currentSection: 1,
        sectionNotification: {
          id: 1,
          title: "Mar Aberto (Cabo Frio)",
          desc: "Águas abertas de correntes frias. Começo da subida em direção à costa."
        },
        nearShipwreck: false
      });
      usePlayerStatsStore.getState().resetStats();
      useEnvironmentStore.getState().generateEnvironment();
    },
    resetGame: () => {
      useGameStateStore.setState({
        isPlaying: false,
        isGameOver: false,
        isGameWon: false,
        isPaused: false,
        currentSection: 1,
        sectionNotification: null,
        nearShipwreck: false
      });
      usePlayerStatsStore.getState().resetStats();
      useEnvironmentStore.getState().clearEnvironment();
    },
    togglePause: () => {
      useGameStateStore.getState().togglePause();
    },
    damagePlayer: (amount: number) => {
      usePlayerStatsStore.getState().damagePlayer(amount, true);
    },
    shootBubble: (origin: [number, number, number], direction: [number, number, number]) => {
      useEnvironmentStore.getState().spawnBubble(origin, direction);
    },
    updateWorld: (delta: number, playerPos: THREE.Vector3) => {
      useEnvironmentStore.getState().updateWorld(delta, playerPos);
    },
    rechargeBoost: (amount: number) => {
      usePlayerStatsStore.getState().rechargeBoost(amount);
    },
    consumeBoost: (amount: number) => {
      return usePlayerStatsStore.getState().consumeBoost(amount);
    },
    updateSection: (z: number) => {
      const { currentSection, isPlaying, isGameOver, isGameWon } = useGameStateStore.getState();
      if (!isPlaying || isGameOver || isGameWon) return;

      let matchedSec = SECTIONS[0];
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        if (z <= SECTIONS[i].threshold) {
          matchedSec = SECTIONS[i];
          break;
        }
      }

      if (matchedSec.id !== currentSection) {
        useGameStateStore.setState({
          currentSection: matchedSec.id,
          sectionNotification: {
            id: matchedSec.id,
            title: matchedSec.name,
            desc: matchedSec.desc
          }
        });
      }

      const nearWreck = z <= -1735 && z >= -1825;
      if (nearWreck !== useGameStateStore.getState().nearShipwreck) {
        useGameStateStore.setState({ nearShipwreck: nearWreck });
      }

      if (z <= -1980) {
        useGameStateStore.setState({
          isPlaying: false,
          isGameWon: true
        });
      }
    }
  };

  if (selector) {
    return selector(combined);
  }
  return combined;
}) as any;

(useGameStore as any).getState = () => {
  const gameState = useGameStateStore.getState();
  const playerStats = usePlayerStatsStore.getState();
  const environment = useEnvironmentStore.getState();

  return {
    ...gameState,
    ...playerStats,
    ...environment,
    startGame: () => {
      useGameStateStore.setState({
        isPlaying: true,
        isGameOver: false,
        isGameWon: false,
        isPaused: false,
        currentSection: 1,
        sectionNotification: {
          id: 1,
          title: "Mar Aberto (Cabo Frio)",
          desc: "Águas abertas de correntes frias. Começo da subida em direção à costa."
        },
        nearShipwreck: false
      });
      usePlayerStatsStore.getState().resetStats();
      useEnvironmentStore.getState().generateEnvironment();
    },
    resetGame: () => {
      useGameStateStore.setState({
        isPlaying: false,
        isGameOver: false,
        isGameWon: false,
        isPaused: false,
        currentSection: 1,
        sectionNotification: null,
        nearShipwreck: false
      });
      usePlayerStatsStore.getState().resetStats();
      useEnvironmentStore.getState().clearEnvironment();
    },
    togglePause: () => useGameStateStore.getState().togglePause(),
    damagePlayer: (amount: number) => usePlayerStatsStore.getState().damagePlayer(amount, true),
    shootBubble: (origin: [number, number, number], direction: [number, number, number]) => useEnvironmentStore.getState().spawnBubble(origin, direction),
    updateWorld: (delta: number, playerPos: THREE.Vector3) => useEnvironmentStore.getState().updateWorld(delta, playerPos),
    rechargeBoost: (amount: number) => usePlayerStatsStore.getState().rechargeBoost(amount),
    consumeBoost: (amount: number) => usePlayerStatsStore.getState().consumeBoost(amount),
    updateSection: (z: number) => {
      const { currentSection, isPlaying, isGameOver, isGameWon } = useGameStateStore.getState();
      if (!isPlaying || isGameOver || isGameWon) return;

      let matchedSec = SECTIONS[0];
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        if (z <= SECTIONS[i].threshold) {
          matchedSec = SECTIONS[i];
          break;
        }
      }

      if (matchedSec.id !== currentSection) {
        useGameStateStore.setState({
          currentSection: matchedSec.id,
          sectionNotification: {
            id: matchedSec.id,
            title: matchedSec.name,
            desc: matchedSec.desc
          }
        });
      }

      const nearWreck = z <= -1735 && z >= -1825;
      if (nearWreck !== useGameStateStore.getState().nearShipwreck) {
        useGameStateStore.setState({ nearShipwreck: nearWreck });
      }

      if (z <= -1980) {
        useGameStateStore.setState({
          isPlaying: false,
          isGameWon: true
        });
      }
    }
  };
};

(useGameStore as any).setState = (updater: any) => {
  const keys = typeof updater === "function" ? updater((useGameStore as any).getState()) : updater;
  
  const gameStateKeys: any = {};
  const playerStatsKeys: any = {};
  const environmentKeys: any = {};

  const dummyGameState = useGameStateStore.getState();
  const dummyPlayerStats = usePlayerStatsStore.getState();

  Object.keys(keys).forEach((key) => {
    if (key in dummyGameState) {
      gameStateKeys[key] = keys[key];
    } else if (key in dummyPlayerStats) {
      playerStatsKeys[key] = keys[key];
    } else {
      environmentKeys[key] = keys[key];
    }
  });

  if (Object.keys(gameStateKeys).length > 0) useGameStateStore.setState(gameStateKeys);
  if (Object.keys(playerStatsKeys).length > 0) usePlayerStatsStore.setState(playerStatsKeys);
  if (Object.keys(environmentKeys).length > 0) useEnvironmentStore.setState(environmentKeys);
};
