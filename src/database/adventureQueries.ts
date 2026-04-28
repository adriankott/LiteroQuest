import { ADVENTURE_FLOORS } from '../constants/adventure';
import { AdventureMap, AdventureRun } from '../types/adventure';
import { getDatabase } from './index';

interface RunRow {
  id: number;
  profile_id: number;
  current_floor: number;
  last_node_id: string | null;
  completed_nodes: string;
  map_data: string;
  status: string;
  started_at: number;
  completed_at: number | null;
  total_stars: number;
}

function rowToRun(row: RunRow): AdventureRun {
  return {
    id: row.id,
    profileId: row.profile_id,
    currentFloor: row.current_floor,
    lastNodeId: row.last_node_id,
    completedNodes: JSON.parse(row.completed_nodes),
    mapData: JSON.parse(row.map_data),
    status: row.status as AdventureRun['status'],
    startedAt: row.started_at,
    completedAt: row.completed_at,
    totalStars: row.total_stars,
  };
}

export async function createAdventureRun(
  profileId: number,
  mapData: AdventureMap,
): Promise<AdventureRun> {
  const db = getDatabase();
  const result = await db.runAsync(
    `INSERT INTO adventure_runs (profile_id, map_data, started_at) VALUES (?, ?, ?)`,
    [profileId, JSON.stringify(mapData), Date.now()],
  );
  return {
    id: result.lastInsertRowId,
    profileId,
    currentFloor: 0,
    lastNodeId: null,
    completedNodes: {},
    mapData,
    status: 'active',
    startedAt: Date.now(),
    completedAt: null,
    totalStars: 0,
  };
}

export async function getActiveRun(profileId: number): Promise<AdventureRun | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<RunRow>(
    `SELECT * FROM adventure_runs WHERE profile_id = ? AND status = 'active' ORDER BY started_at DESC LIMIT 1`,
    [profileId],
  );
  return row ? rowToRun(row) : null;
}

export async function getLastRun(profileId: number): Promise<AdventureRun | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<RunRow>(
    `SELECT * FROM adventure_runs WHERE profile_id = ? ORDER BY started_at DESC LIMIT 1`,
    [profileId],
  );
  return row ? rowToRun(row) : null;
}

export async function completeAdventureNode(
  runId: number,
  nodeId: string,
  stars: number,
): Promise<AdventureRun> {
  const db = getDatabase();
  const row = await db.getFirstAsync<RunRow>(
    `SELECT * FROM adventure_runs WHERE id = ?`,
    [runId],
  );
  if (!row) throw new Error(`Adventure run ${runId} not found`);

  const completedNodes: Record<string, number> = JSON.parse(row.completed_nodes);
  completedNodes[nodeId] = stars;

  const newFloor = row.current_floor + 1;
  const isFinished = newFloor >= ADVENTURE_FLOORS;
  const newStatus = isFinished ? 'completed' : 'active';
  const newTotalStars = row.total_stars + stars;

  await db.runAsync(
    `UPDATE adventure_runs SET
       current_floor = ?, last_node_id = ?, completed_nodes = ?,
       total_stars = ?, status = ?, completed_at = ?
     WHERE id = ?`,
    [
      newFloor,
      nodeId,
      JSON.stringify(completedNodes),
      newTotalStars,
      newStatus,
      isFinished ? Date.now() : null,
      runId,
    ],
  );

  return rowToRun({
    ...row,
    current_floor: newFloor,
    last_node_id: nodeId,
    completed_nodes: JSON.stringify(completedNodes),
    total_stars: newTotalStars,
    status: newStatus,
    completed_at: isFinished ? Date.now() : null,
  });
}

export async function abandonAdventureRun(runId: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `UPDATE adventure_runs SET status = 'abandoned' WHERE id = ?`,
    [runId],
  );
}
