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

export type Project = {
  id: string;
  projectNumber: string;
  projectName: string;
  constructionSection: string;
  lineName: string;
  towerConfigs: TowerConfig[];
};

export type HistoryItem = {
  status: string;
  timestamp: number;
  photo: string;
  userName?: string;
  affiliation?: string;
};

export type Point = {
  id: string;
  name: string;
  circuit: number;
  type: 'main' | 'sub';
  status: 'none' | 'grounding' | 'removed' | 'exempt';
  history: HistoryItem[];
};

export type Tower = {
  id: string;
  number: string;
  name: string;
  points: Point[];
};

export type Registry = {
  id: string;
  title: string;
  file_data: string;
  user_name: string;
  created_at: string;
};
