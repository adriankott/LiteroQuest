export type NodeType = 'phonics' | 'words' | 'alphabet' | 'elite' | 'boss' | 'treasure' | 'rest';

export interface AdventureNode {
  id: string;           // `${floor}-${position}`
  floor: number;
  position: number;     // 0=left, 1=center, 2=right
  type: NodeType;
  difficulty: 1 | 2 | 3;
  connections: string[]; // ids of nodes on floor+1 this node connects to
}

export interface AdventureMap {
  nodes: Record<string, AdventureNode>;
}

export interface AdventureRun {
  id: number;
  profileId: number;
  currentFloor: number;                       // next floor to enter (0-51)
  lastNodeId: string | null;                  // last completed node id
  completedNodes: Record<string, number>;     // nodeId -> stars earned
  mapData: AdventureMap;
  status: 'active' | 'completed' | 'abandoned';
  startedAt: number;
  completedAt: number | null;
  totalStars: number;
}
