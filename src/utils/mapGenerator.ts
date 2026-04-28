import {
  ADVENTURE_FLOORS,
  BOSS_FLOORS,
  ELITE_FLOORS,
  TREASURE_FLOORS,
  REST_FLOORS,
  getDifficultyForFloor,
} from '../constants/adventure';
import { AdventureMap, AdventureNode, NodeType } from '../types/adventure';

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

function getNodeType(floor: number, rand: () => number): NodeType {
  if (BOSS_FLOORS.includes(floor)) return 'boss';
  if (ELITE_FLOORS.includes(floor)) return 'elite';
  if (TREASURE_FLOORS.includes(floor)) return 'treasure';
  if (REST_FLOORS.includes(floor)) return 'rest';
  const r = rand();
  if (r < 0.38) return 'phonics';
  if (r < 0.72) return 'words';
  return 'alphabet';
}

function getFloorPositions(floor: number, rand: () => number): number[] {
  // Boss floors and floor 0: all 3 positions available
  if (floor === 0) return [0, 1, 2];
  if (BOSS_FLOORS.includes(floor)) return [1]; // center only
  const r = rand();
  if (r < 0.45) return [0, 1, 2];
  if (r < 0.72) return [0, 1];
  return [1, 2];
}

export function generateAdventureMap(seed: number = Date.now()): AdventureMap {
  const rand = seededRand(seed);
  const nodes: Record<string, AdventureNode> = {};

  // Determine which positions are active per floor
  const floorPositions: number[][] = Array.from({ length: ADVENTURE_FLOORS }, (_, f) =>
    getFloorPositions(f, rand),
  );

  // Create nodes
  for (let f = 0; f < ADVENTURE_FLOORS; f++) {
    for (const pos of floorPositions[f]) {
      const id = `${f}-${pos}`;
      nodes[id] = {
        id,
        floor: f,
        position: pos,
        type: getNodeType(f, rand),
        difficulty: getDifficultyForFloor(f),
        connections: [],
      };
    }
  }

  // Generate connections (floor f → floor f+1)
  // Rule: position p may only connect to positions in range [p-1, p+1] to avoid path crossings
  for (let f = 0; f < ADVENTURE_FLOORS - 1; f++) {
    const currPos = floorPositions[f];
    const nextPos = floorPositions[f + 1];

    for (const cp of currPos) {
      const candidates = nextPos.filter((np) => Math.abs(np - cp) <= 1);
      if (candidates.length === 0) continue;

      // Sort by proximity (closest first)
      candidates.sort((a, b) => Math.abs(a - cp) - Math.abs(b - cp));

      // Always connect to the closest candidate
      nodes[`${f}-${cp}`].connections.push(`${f + 1}-${candidates[0]}`);

      // 30% chance to also connect to a second candidate
      if (candidates.length > 1 && rand() < 0.3) {
        nodes[`${f}-${cp}`].connections.push(`${f + 1}-${candidates[1]}`);
      }
    }

    // Guarantee every next-floor node has at least one incoming connection
    for (const np of nextPos) {
      const targetId = `${f + 1}-${np}`;
      const isReachable = currPos.some((cp) =>
        nodes[`${f}-${cp}`].connections.includes(targetId),
      );
      if (!isReachable) {
        const viable = currPos.filter((cp) => Math.abs(cp - np) <= 1);
        if (viable.length > 0) {
          const cp = viable[Math.floor(rand() * viable.length)];
          nodes[`${f}-${cp}`].connections.push(targetId);
        }
      }
    }
  }

  return { nodes };
}

export function getAvailableNodes(
  mapData: AdventureMap,
  currentFloor: number,
  lastNodeId: string | null,
): AdventureNode[] {
  const allNodes = Object.values(mapData.nodes);

  if (currentFloor === 0) {
    return allNodes.filter((n) => n.floor === 0);
  }

  if (!lastNodeId) return [];

  const lastNode = mapData.nodes[lastNodeId];
  if (!lastNode) return [];

  return lastNode.connections
    .map((id) => mapData.nodes[id])
    .filter(Boolean)
    .filter((n) => n.floor === currentFloor);
}
