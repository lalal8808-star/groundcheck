import { TowerConfig, LineConfig, Point, Phase, GroundingType } from './types';

export function genLineId() {
  return 'line-' + Math.random().toString(36).slice(2, 10);
}

export function buildDefaultTowerConfigs(): TowerConfig[] {
  const names: string[] = ['이천S/S'];
  for (let i = 1; i <= 25; i++) names.push(`${i}호`);
  return names.map(name => ({ name }));
}

export function buildDefaultLineConfigs(): LineConfig[] {
  return [{ id: 'default', name: '기본 선로', towers: buildDefaultTowerConfigs() }];
}

/** tower_configs(jsonb)를 항상 LineConfig[] 로 정규화 */
export function migrateToLineConfigs(raw: any): LineConfig[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return buildDefaultLineConfigs();
  }
  // 새 포맷: [{id, name, towers}]
  if (raw[0] && typeof raw[0] === 'object' && 'towers' in raw[0]) {
    return raw.map((l: any) => ({
      id: l.id || genLineId(),
      name: l.name || '선로',
      towers: Array.isArray(l.towers) ? l.towers : [],
    }));
  }
  // 구 포맷: [{name}, ...] → 단일 '기본 선로'로 감싸기
  return [{ id: 'default', name: '기본 선로', towers: raw as TowerConfig[] }];
}

/**
 * lineId + towerIdx 기반으로 12개 Point(2회선 × 3상 × 주/보접지) 생성.
 * tower_id 포맷: `${lineId}-tower-${idx}`
 * point_id 포맷: `${lineId}-t${idx}-c${circuit}-${phase}-${groundingType}`
 */
export function buildPoints(lineId: string, towerIdx: number, logs: any[]): Point[] {
  const points: Point[] = [];
  const towerId = `${lineId}-tower-${towerIdx}`;
  [1, 2].forEach(circuit => {
    (['a', 'b', 'c'] as Phase[]).forEach(phase => {
      (['main', 'sub'] as GroundingType[]).forEach(groundingType => {
        const ptId = `${lineId}-t${towerIdx}-c${circuit}-${phase}-${groundingType}`;
        const ptLogs = logs.filter((l: any) => l.tower_id === towerId && l.point_id === ptId);
        const latest = ptLogs[0];
        const typeLabel = groundingType === 'main' ? '주접지' : '보조접지';
        points.push({
          id: ptId,
          name: `${phase.toUpperCase()}상 ${typeLabel}`,
          phase,
          groundingType,
          circuit,
          status: latest ? latest.status : 'none',
          // 최신 로그만 meta로 유지 (photo는 기록보기 모달이 지연 로드)
          history: ptLogs.map((l: any) => ({
            status: l.status,
            timestamp: new Date(l.created_at).getTime(),
            photo: '',                   // lazy-loaded
            userName: l.user_name,
            affiliation: l.affiliation,
          })),
        });
      });
    });
  });
  return points;
}
