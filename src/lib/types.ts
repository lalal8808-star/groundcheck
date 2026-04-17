export type AdminProject = {
  id: string;
  project_number: string;
  project_name: string;
  created_at: string;
  deleted_at: string | null;
};

export type User = {
  id: string;
  name: string;
  affiliation: string;
};

export type TowerConfig = {
  name: string;
};

export type LineConfig = {
  id: string;          // 프로젝트 내 고유 선로 ID
  name: string;        // 선로명
  towers: TowerConfig[];
};

export type Project = {
  id: string;
  projectNumber: string;
  projectName: string;
  constructionSection: string;
  lineName: string;        // 레거시 필드. 여러 선로는 towerConfigs(LineConfig[]) 내 name 사용
  towerConfigs: any;       // jsonb — 실제로는 LineConfig[] (마이그레이션 후)
};

export type HistoryItem = {
  status: string;
  timestamp: number;
  photo: string;
  userName?: string;
  affiliation?: string;
};

export type Phase = 'a' | 'b' | 'c';
export type GroundingType = 'main' | 'sub';  // 주접지 / 보조접지

export type Point = {
  id: string;
  name: string;             // 'A상 주접지' / 'A상 보조접지' 등
  phase: Phase;
  groundingType: GroundingType;
  circuit: number;
  status: 'none' | 'grounding' | 'removed' | 'exempt';
  history: HistoryItem[];
};

export type Tower = {
  id: string;
  number: string;
  name: string;
  lineId: string;
  points: Point[];
};

export type Registry = {
  id: string;
  title: string;
  file_data: string;
  user_name: string;
  created_at: string;
};
