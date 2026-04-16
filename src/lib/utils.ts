import { TowerConfig, Point } from './types';

export function buildDefaultTowerConfigs(): TowerConfig[] {
  const names: string[] = ['이천S/S'];
  for (let i = 1; i <= 25; i++) names.push(`${i}호`);
  return names.map(name => ({ name }));
}

export function buildPoints(towerIdx: number, logs: any[]): Point[] {
  const points: Point[] = [];
  [1, 2].forEach(circuit => {
    ['main', 'sub'].forEach(type => {
      const ptId = `t${towerIdx}-c${circuit}-${type}`;
      const ptLogs = logs.filter((l: any) => l.tower_id === `tower-${towerIdx}` && l.point_id === ptId);
      const latest = ptLogs[0];
      points.push({
        id: ptId,
        name: type === 'main' ? '주접지' : '보조접지',
        circuit,
        type: type as 'main' | 'sub',
        status: latest ? latest.status : 'none',
        history: ptLogs.map((l: any) => ({
          status: l.status,
          timestamp: new Date(l.created_at).getTime(),
          photo: l.photo_data,
          userName: l.user_name,
          affiliation: l.affiliation,
        })),
      });
    });
  });
  return points;
}
