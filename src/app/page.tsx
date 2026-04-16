'use client';

import { useState, useEffect, useCallback } from 'react';
import { loginToProject, createProject, getAdminProjects, deleteProject, restoreProject, updateProjectCredentials, uploadGrounding, getLatestGrounding, uploadRegistry, getRegistries, deleteRegistry, deleteGroundingLog, togglePointExempt, getRegistryData, getProjectSettings, saveProjectSettings } from './actions';

// HEIC/HEIF 여부를 파일 시그니처(magic bytes)로 감지
async function isHeicFile(file: File): Promise<boolean> {
  if (file.type === 'image/heic' || file.type === 'image/heif' ||
    file.type === 'image/heic-sequence' || file.type === 'image/heif-sequence' ||
    file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
    return true;
  }
  // type이 비어있거나 틀린 경우를 대비해 파일 앞부분 바이트 확인
  try {
    const buf = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buf);
    // ftyp box: offset 4~8 = 'ftyp'
    const ftyp = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    if (ftyp === 'ftyp') {
      const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
      if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'miaf', 'MiHE'].some(b => brand.startsWith(b))) {
        return true;
      }
    }
  } catch { /* ignore */ }
  return false;
}

type AdminProject = {
  id: string;
  project_number: string;
  project_name: string;
  created_at: string;
  deleted_at: string | null;
};

type User = {
  id: string;
  name: string;
  affiliation: string;
};

type Project = {
  id: string;
  projectNumber: string;
  projectName: string;
  constructionSection: string;
  lineName: string;
  towerConfigs: TowerConfig[];
};

type HistoryItem = {
  status: string;
  timestamp: number;
  photo: string;
  userName?: string;
  affiliation?: string;
};

type Point = {
  id: string;
  name: string;
  circuit: number;
  type: 'main' | 'sub';
  status: 'none' | 'grounding' | 'removed' | 'exempt';
  history: HistoryItem[];
};

type Tower = {
  id: string;
  number: string;
  name: string;
  points: Point[];
};

type Registry = {
  id: string;
  title: string;
  file_data: string;
  user_name: string;
  created_at: string;
};

type TowerConfig = {
  name: string;
};

function buildDefaultTowerConfigs(): TowerConfig[] {
  const names: string[] = ['이천S/S'];
  for (let i = 1; i <= 25; i++) names.push(`${i}호`);
  return names.map(name => ({ name }));
}

function buildPoints(towerIdx: number, logs: any[]): Point[] {
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

const SESSION_KEY = 'groundcheck_session';

export default function GroundCheckApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'towers'>('dashboard');
  const [currentCircuit, setCurrentCircuit] = useState(1);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [registries, setRegistries] = useState<Registry[]>([]);

  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [uploadTowerId, setUploadTowerId] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'install' | 'remove'>('install');

  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<{ towerId: string; pointId: string } | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // Auth modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'admin'>('login');
  const [loginForm, setLoginForm] = useState({ name: '', affiliation: '', projectNumber: '', password: '' });
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminForm, setAdminForm] = useState({ projectNumber: '', password: '', projectName: '' });
  const [adminProjects, setAdminProjects] = useState<AdminProject[]>([]);
  const [adminView, setAdminView] = useState<'create' | 'list'>('list');
  const [authError, setAuthError] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ projectNumber: '', password: '' });

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState({ projectName: '', constructionSection: '', lineName: '' });

  // Tower config in settings
  const [towerConfigsDraft, setTowerConfigsDraft] = useState<TowerConfig[]>([]);
  const [insertStartNum, setInsertStartNum] = useState('');
  const [insertEndNum, setInsertEndNum] = useState('');
  const [insertSingleName, setInsertSingleName] = useState('');
  const [insertMode, setInsertMode] = useState<'single' | 'range'>('single');
  const [insertAfterIdx, setInsertAfterIdx] = useState<number | null>(null);
  const [genStart, setGenStart] = useState('');
  const [genEnd, setGenEnd] = useState('');
  const [genPrefix, setGenPrefix] = useState('');
  const [genSuffix, setGenSuffix] = useState('호');
  const [settingsError, setSettingsError] = useState('');
  const [settingsTab, setSettingsTab] = useState<'project' | 'towers'>('project');

  // Load session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const { user, project } = JSON.parse(saved);
        if (user && project) {
          setCurrentUser(user);
          setCurrentProject(project);
          return;
        }
      } catch { /* ignore */ }
    }
    setShowAuthModal(true);
  }, []);

  // Refresh data when project changes
  useEffect(() => {
    if (currentProject) {
      refreshData(currentProject);
    }
  }, [currentProject?.id]);

  const refreshData = useCallback(async (project?: Project | null) => {
    const proj = project || currentProject;
    if (!proj) return;
    try {
      // Fetch fresh settings from DB
      const freshSettings = await getProjectSettings(proj.id);
      if (freshSettings) {
        const updatedProject = {
          ...proj,
          projectName: freshSettings.projectName,
          constructionSection: freshSettings.constructionSection,
          lineName: freshSettings.lineName,
          towerConfigs: freshSettings.towerConfigs || [],
        };
        setCurrentProject(updatedProject);
        // Update session storage
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) {
          const session = JSON.parse(saved);
          session.project = updatedProject;
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        }
      }

      const configs: TowerConfig[] = freshSettings?.towerConfigs?.length
        ? freshSettings.towerConfigs
        : proj.towerConfigs?.length
          ? proj.towerConfigs
          : buildDefaultTowerConfigs();

      const logs = await getLatestGrounding(Date.now(), proj.id);
      const regsRes = await fetch('/api/registries?t=' + Date.now() + '&projectId=' + proj.id);
      const regs = await regsRes.json();
      setRegistries(regs || []);

      const builtTowers = configs.map((cfg: TowerConfig, i: number) => ({
        id: `tower-${i}`,
        number: cfg.name,
        name: cfg.name,
        points: buildPoints(i, logs),
      }));
      setTowers(builtTowers);
    } catch (e: any) {
      console.error('Failed to fetch data', e);
    }
  }, [currentProject?.id]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // ── Auth handlers ─────────────────────────────────────────────
  const handleLogin = async () => {
    setAuthError('');
    const result = await loginToProject(loginForm.name, loginForm.affiliation, loginForm.projectNumber, loginForm.password);
    if (!result.success) {
      setAuthError(result.error || '로그인에 실패했습니다.');
      return;
    }
    setCurrentUser(result.user as User);
    setCurrentProject(result.project as Project);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: result.user, project: result.project }));
    setShowAuthModal(false);
    showToast(`${result.user.name} 님, 환영합니다.`);
  };

  const handleAdminAuth = async () => {
    setAuthError('');
    if (!adminPassword) {
      setAuthError('관리자 비밀번호를 입력하세요.');
      return;
    }
    const result = await getAdminProjects(adminPassword);
    if (!result.success) {
      setAuthError(result.error || '인증에 실패했습니다.');
      return;
    }
    setAdminProjects(result.data as AdminProject[]);
    setAdminAuthed(true);
    setAdminView('list');
  };

  const refreshAdminProjects = async () => {
    const result = await getAdminProjects(adminPassword);
    if (result.success) setAdminProjects(result.data as AdminProject[]);
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`"${projectName}" 사업을 삭제하시겠습니까?\n삭제 후 히스토리에서 복원 가능합니다.`)) return;
    try {
      const resp = await deleteProject(adminPassword, projectId);
      if (resp.success) {
        await refreshAdminProjects();
        showToast('사업이 삭제되었습니다.');
      } else {
        alert('삭제 실패: ' + resp.error);
      }
    } catch (e: any) {
      alert('삭제 오류: ' + e.message);
    }
  };

  const handleRestoreProject = async (projectId: string, projectName: string) => {
    try {
      const resp = await restoreProject(adminPassword, projectId);
      if (resp.success) {
        await refreshAdminProjects();
        showToast(`"${projectName}" 사업이 복원되었습니다.`);
      } else {
        alert('복원 실패: ' + resp.error);
      }
    } catch (e: any) {
      alert('복원 오류: ' + e.message);
    }
  };

  const handleCreateProject = async () => {
    setAuthError('');
    const result = await createProject(adminPassword, adminForm.projectNumber, adminForm.password, adminForm.projectName);
    if (!result.success) {
      setAuthError(result.error || '사업 생성에 실패했습니다.');
      return;
    }
    showToast('사업이 생성되었습니다.');
    setAdminForm({ projectNumber: '', password: '', projectName: '' });
    await refreshAdminProjects();
    setAdminView('list');
  };

  const handleEditProject = (p: AdminProject) => {
    setEditingProjectId(p.id);
    setEditForm({ projectNumber: p.project_number, password: '' });
    setAuthError('');
  };

  const handleSaveEditProject = async (projectId: string) => {
    setAuthError('');
    const result = await updateProjectCredentials(adminPassword, projectId, editForm.projectNumber, editForm.password);
    if (!result.success) {
      setAuthError(result.error || '수정에 실패했습니다.');
      return;
    }
    showToast('사업 정보가 수정되었습니다.');
    setEditingProjectId(null);
    await refreshAdminProjects();
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setCurrentProject(null);
    setTowers([]);
    setRegistries([]);
    setShowAuthModal(true);
    setLoginForm({ name: '', affiliation: '', projectNumber: '', password: '' });
    setAuthError('');
    setAuthTab('login');
    setAdminAuthed(false);
  };

  // ── Stats ──────────────────────────────────────────────────────
  let totalPoints = 0;
  let stats = { none: 0, grounding: 0, removed: 0, exempt: 0 };
  towers.forEach(tower => {
    tower.points.forEach(pt => {
      if (pt.circuit === currentCircuit) {
        if (pt.status in stats) stats[pt.status as keyof typeof stats]++;
        if (pt.status !== 'exempt') totalPoints++;
      }
    });
  });
  const progressPct = totalPoints ? Math.round((stats.removed / totalPoints) * 100) : 0;

  // ── File handlers ──────────────────────────────────────────────
  const processImageFile = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        try {
          const MAX_DIM = 1000;
          let { width, height } = img;
          if (width > height) { if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; } }
          else { if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; } }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) { ctx.fillStyle = 'white'; ctx.fillRect(0, 0, width, height); ctx.drawImage(img, 0, 0, width, height); }
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        } catch (e) {
          reject(e);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('이미지를 디코딩할 수 없습니다. 형식을 지원하지 않거나 깨진 파일입니다.'));
      };
      img.src = objectUrl;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setUploadMessage('이미지 처리 중...');

    try {
      const isHeic = await isHeicFile(file);
      if (isHeic) {
        alert('HEIF 형식은 지원되지 않습니다.\n카메라 앱이나 갤러리에서 사진을 선택하실 때 일반 JPEG 옵션을 사용하시거나, 설정 > 카메라 > 포맷에서 "가장 호환성 높은"으로 변경해주세요.');
        setIsLoading(false);
        setUploadMessage('');
        if (e.target) e.target.value = '';
        return;
      }

      const dataUrl = await processImageFile(file);
      setPendingPhotoPreview(dataUrl);

    } catch (err: any) {
      console.error('[handleFileSelect]', err);
      alert('이미지 처리 실패: ' + (err?.message || '알 수 없는 오류'));
      if (e.target) e.target.value = '';
    } finally {
      setIsLoading(false);
      setUploadMessage('');
    }
  };


  const handlePhotoUpload = async () => {
    if (!currentUser || !currentProject) return setShowAuthModal(true);
    if (!uploadTowerId || !selectedPointId || !pendingPhotoPreview) return;
    setIsLoading(true);
    setUploadMessage('파일 전송 중...');
    try {
      const resp = await uploadGrounding({
        towerId: uploadTowerId,
        pointId: selectedPointId,
        status: uploadType === 'install' ? 'grounding' : 'removed',
        photoData: pendingPhotoPreview,
        userId: currentUser.id,
        projectId: currentProject.id,
      });
      if (resp.success) {
        setPendingPhotoPreview(null);
        setSelectedPointId(null);
        setUploadTowerId(null);
        await refreshData();
        showToast('업로드가 완료되었습니다.');
      } else {
        alert('업로드 기록 실패: ' + resp.error);
      }
    } catch (e: any) {
      alert('파일 전송 실패: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser || !currentProject) return setShowAuthModal(true);
    const file = e.target.files?.[0];
    if (!file) return;
    const title = prompt('접지관리대장 제목을 입력하세요');
    if (!title) { if (e.target) e.target.value = ''; return; }
    setIsLoading(true);
    setUploadMessage('파일 전송 중...');
    const isImage = file.type.startsWith('image/');
    const processAndUpload = async (fileData: string) => {
      if (fileData.length > 2500000) {
        alert('파일이 너무 큽니다. 이미지는 자동 압축되며, 기타 파일은 2MB 이하로 올려주세요.');
        setIsLoading(false);
        if (e.target) e.target.value = '';
        return;
      }
      try {
        const resp = await uploadRegistry(title, fileData, currentUser!.id, currentProject!.id);
        if (resp.success) { await refreshData(); showToast('대장이 성공적으로 등록되었습니다.'); }
        else alert('대장 기록 실패: ' + resp.error);
      } catch (err: any) {
        alert('대장 파일 업로드 에러: ' + err.message);
      } finally {
        setIsLoading(false);
        if (e.target) e.target.value = '';
      }
    };
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const MAX_DIM = 1200;
          let { width, height } = img;
          if (width > height) { if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; } }
          else { if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; } }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) { ctx.fillStyle = 'white'; ctx.fillRect(0, 0, width, height); ctx.drawImage(img, 0, 0, width, height); }
          processAndUpload(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => processAndUpload(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleExempt = async (tId: string, pId: string, currentStatus: string) => {
    if (!currentUser || !currentProject) return setShowAuthModal(true);
    if (currentStatus !== 'exempt' && !confirm('비대상으로 전환하시겠습니까? (기록은 유지되지만 통계에서 제외됩니다)')) return;
    setIsLoading(true);
    try {
      const resp = await togglePointExempt(tId, pId, currentUser.id, currentStatus !== 'exempt', currentProject.id);
      if (resp.success) await refreshData();
      else alert('실패: ' + resp.error);
    } catch (e: any) {
      alert('전환 에러: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getTowerOverallStatus = (tower: Tower) => {
    const points = tower.points.filter(p => p.circuit === currentCircuit);
    const groundingCnt = points.filter(p => p.status === 'grounding').length;
    const removedCnt = points.filter(p => p.status === 'removed').length;
    const exemptCnt = points.filter(p => p.status === 'exempt').length;
    const total = points.length;
    if (exemptCnt === total && total > 0) return 'exempt';
    if (removedCnt + exemptCnt === total && removedCnt > 0) return 'removed';
    if (groundingCnt > 0 || removedCnt > 0) return 'grounding';
    return 'none';
  };

  const selectedTower = towers.find(t => t.id === selectedTowerId);

  // ── Settings handlers ──────────────────────────────────────────

  const openSettings = () => {
    if (!currentProject) return;
    setSettingsDraft({
      projectName: currentProject.projectName,
      constructionSection: currentProject.constructionSection,
      lineName: currentProject.lineName,
    });
    const configs = currentProject.towerConfigs?.length ? currentProject.towerConfigs : buildDefaultTowerConfigs();
    setTowerConfigsDraft([...configs.map(t => ({ ...t }))]);
    setSettingsError('');
    setSettingsTab('project');
    setGenStart('');
    setGenEnd('');
    setGenPrefix('');
    setGenSuffix('호');
    setInsertAfterIdx(null);
    setInsertStartNum('');
    setInsertEndNum('');
    setInsertSingleName('');
    setInsertMode('single');
    setShowSettings(true);
  };

  const saveSettings = async () => {
    if (!currentProject) return;
    setIsLoading(true);
    try {
      const resp = await saveProjectSettings(currentProject.id, currentUser!.id, settingsDraft, towerConfigsDraft);
      if (resp.success) {
        setShowSettings(false);
        await refreshData();
        showToast('설정이 저장되었습니다.');
      } else {
        alert('설정 저장 실패: ' + resp.error);
      }
    } catch (e: any) {
      alert('설정 저장 에러: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTowerList = () => {
    setSettingsError('');
    const s = parseInt(genStart, 10);
    const e = parseInt(genEnd, 10);
    if (isNaN(s) || isNaN(e) || s > e) {
      setSettingsError('올바른 시점/종점 번호를 입력하세요.');
      return;
    }
    const newList: TowerConfig[] = [];
    for (let i = s; i <= e; i++) {
      newList.push({ name: `${genPrefix}${i}${genSuffix}` });
    }
    setTowerConfigsDraft(newList);
  };

  const handleInsertTowers = (afterIdx: number) => {
    setSettingsError('');
    const existingNames = towerConfigsDraft.map(t => t.name);
    const toInsert: TowerConfig[] = [];

    if (insertMode === 'single') {
      const name = insertSingleName.trim();
      if (!name) {
        setSettingsError('철탑명을 입력하세요.');
        return;
      }
      if (existingNames.includes(name)) {
        setSettingsError(`중복 오류: "${name}"은 이미 목록에 있습니다.`);
        return;
      }
      toInsert.push({ name });
    } else {
      const s = parseInt(insertStartNum, 10);
      const e = parseInt(insertEndNum, 10);
      if (isNaN(s) || isNaN(e) || s > e) {
        setSettingsError('올바른 삽입 번호를 입력하세요.');
        return;
      }
      for (let i = s; i <= e; i++) {
        const name = `${i}호`;
        if (existingNames.includes(name)) {
          setSettingsError(`중복 오류: "${name}"은 이미 목록에 있습니다.`);
          return;
        }
        toInsert.push({ name });
      }
    }

    const updated = [...towerConfigsDraft];
    updated.splice(afterIdx + 1, 0, ...toInsert);
    setTowerConfigsDraft(updated);
    setInsertAfterIdx(null);
    setInsertStartNum('');
    setInsertEndNum('');
    setInsertSingleName('');
  };

  const handleRemoveTower = (idx: number) => {
    const tower = towers.find(t => t.id === `tower-${idx}`);
    if (tower) {
      const hasPhoto = tower.points.some(p => p.history.length > 0);
      const hasExempt = tower.points.some(p => p.status === 'exempt');
      if (hasPhoto) {
        setSettingsError(`삭제 불가: "${tower.name}"에 이미 업로드된 사진이 있습니다.`);
        return;
      }
      if (hasExempt) {
        setSettingsError(`삭제 불가: "${tower.name}"에 비대상으로 선택된 접지점이 있습니다.`);
        return;
      }
    }
    setSettingsError('');
    setTowerConfigsDraft(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <>
      <header id="app-header">
        <div className="header-content">
          <div className="header-left">
            <svg className="logo-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div className="header-text">
              <h1 id="main-title">접지관리 시스템</h1>
            </div>
          </div>
          <div className="header-right">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
              {currentUser && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>{currentUser.affiliation} {currentUser.name} 님</span>
                  <button
                    id="settings-btn"
                    onClick={openSettings}
                    title="설정"
                    style={{
                      background: 'rgba(0,0,0,0.05)',
                      border: 'none',
                      borderRadius: '0.6rem',
                      padding: '0.35rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      transition: 'background 0.2s',
                    }}
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="circuit-toggle">
                <button className={`circuit-btn ${currentCircuit === 1 ? 'active' : ''}`} onClick={() => setCurrentCircuit(1)}>1회선</button>
                <button className={`circuit-btn ${currentCircuit === 2 ? 'active' : ''}`} onClick={() => setCurrentCircuit(2)}>2회선</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="top-nav">
        <button className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`} style={{ fontSize: '1.2rem', padding: '1rem 2rem' }} onClick={() => setCurrentView('dashboard')}>
          <svg style={{ width: '1.5rem', height: '1.5rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          <span className="btn-label">대시보드</span>
        </button>
        <button className={`nav-btn ${currentView === 'towers' ? 'active' : ''}`} style={{ fontSize: '1.2rem', padding: '1rem 2rem' }} onClick={() => setCurrentView('towers')}>
          <svg style={{ width: '1.5rem', height: '1.5rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          <span className="btn-label">철탑목록</span>
        </button>
      </nav>

      {currentView === 'dashboard' ? (
        <section className="view active">
          <div className="dashboard-container">
            {/* 공사 개요 */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.25rem', background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>공사 개요</h2>
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>사업명</span>
                  <span style={{ fontWeight: 600 }}>{currentProject?.projectName || '-'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>공사구간</span>
                    <span style={{ fontWeight: 600 }}>{currentProject?.constructionSection || '-'}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>선로명</span>
                    <span style={{ fontWeight: 600 }}>{currentProject?.lineName || '-'}</span>
                  </div>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>총 철탑수</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{towers.length}기</span>
                </div>
              </div>
            </div>

            {/* 접지 현황 */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>접지 현황 ({currentCircuit}회선)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: 12 }}>
                  <span>총 대상개소 <small>(비대상 제외)</small></span>
                  <span style={{ fontWeight: 'bold' }}>{totalPoints}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  <div style={{ textAlign: 'center', padding: '0.5rem', background: '#f1f5f9', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.7rem' }}>미등록</div>
                    <div style={{ fontWeight: 700 }}>{stats.none}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, color: 'var(--status-grounding)' }}>
                    <div style={{ fontSize: '0.7rem' }}>접지중</div>
                    <div style={{ fontWeight: 700 }}>{stats.grounding}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8, color: 'var(--status-removed)' }}>
                    <div style={{ fontSize: '0.7rem' }}>접지철거</div>
                    <div style={{ fontWeight: 700 }}>{stats.removed}</div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>전체 진척도</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{progressPct}%</span>
                  </div>
                  <div className="progress-track"><div className="progress-fill secondary" style={{ width: `${progressPct}%` }} /></div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem', textAlign: 'right' }}>
                    검산식: 접지철거({stats.removed}) ÷ 전체대상({totalPoints}) × 100
                  </div>
                </div>
              </div>
            </div>

            {/* 접지관리대장 */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  접지관리대장
                </h3>
                <button className="photo-btn primary" onClick={() => document.getElementById('reg-in')?.click()} disabled={isLoading}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '1rem', height: '1rem' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  파일 업로드
                </button>
                <input id="reg-in" type="file" onClick={(e) => { (e.target as any).value = ''; }} onChange={handleRegistryUpload} style={{ display: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {registries.map(reg => (
                  <div key={reg.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{reg.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{reg.user_name} | {new Date(reg.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="photo-btn" onClick={async () => {
                        try {
                          setIsLoading(true);
                          const dataUrl = await getRegistryData(reg.id, currentProject!.id);
                          if (!dataUrl) { alert('데이터가 없습니다.'); return; }
                          const [header, base64Data] = dataUrl.split(',');
                          const mimeMatch = header.match(/:(.*?);/);
                          const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
                          const byteChars = atob(base64Data);
                          const byteArr = new Uint8Array(byteChars.length);
                          for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
                          const blob = new Blob([byteArr], { type: mimeType });
                          const blobUrl = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = blobUrl; link.download = reg.title;
                          document.body.appendChild(link); link.click(); document.body.removeChild(link);
                          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
                        } catch (e: any) { alert('열기 실패: ' + e.message); }
                        finally { setIsLoading(false); }
                      }} style={{ fontSize: '0.75rem' }}>열기</button>
                      <button className="photo-btn danger" onClick={async () => {
                        if (confirm('삭제하시겠습니까?')) {
                          try { await deleteRegistry(reg.id, currentProject!.id); refreshData(); } catch (e: any) { alert('오류: ' + e.message); }
                        }
                      }} style={{ padding: '4px 8px' }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="view active">
          <div className="towers-container">
            <div className="tower-list">
              {towers.map(tower => {
                const points = tower.points.filter(p => p.circuit === currentCircuit);
                return (
                  <div key={tower.id} className="tower-item glass-card" onClick={() => setSelectedTowerId(tower.id)}>
                    <div className="tower-number">{tower.name}</div>
                    <div className="status-dots">
                      {points.map(p => (
                        <div key={p.id} className={`status-circle ${p.status === 'grounding' ? 'grounding' : p.status === 'removed' ? 'removed' : p.status === 'exempt' ? 'exempt' : ''}`} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Auth Modal ── */}
      {showAuthModal && (
        <div className="modal-overlay active">
          <div className="modal-content glass-card" style={{ maxWidth: 420, margin: 'auto' }}>
            <div className="modal-header">
              <h2>접지관리 시스템</h2>
            </div>

            {/* Tab navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 1.25rem' }}>
              {(['login', 'admin'] as const).map(tab => (
                <button key={tab} onClick={() => { setAuthError(''); setAuthTab(tab); setAdminAuthed(false); }}
                  style={{
                    flex: 1, padding: '0.75rem', border: 'none', background: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: '0.9rem',
                    color: authTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                    borderBottom: authTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                    transition: 'all 0.2s',
                  }}>
                  {tab === 'login' ? '로그인' : '사업 생성 (관리자)'}
                </button>
              ))}
            </div>

            <div className="modal-body" style={{ padding: '1.25rem' }}>
              {authError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.75rem', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
                  {authError}
                </div>
              )}

              {authTab === 'login' ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>소속</label>
                      <input type="text" placeholder="소속을 입력하세요" value={loginForm.affiliation}
                        onChange={e => setLoginForm({ ...loginForm, affiliation: e.target.value })}
                        style={{ padding: '0.65rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: 8, width: '100%', fontSize: '0.9rem', fontFamily: 'var(--font-sans)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>이름</label>
                      <input type="text" placeholder="이름을 입력하세요" value={loginForm.name}
                        onChange={e => setLoginForm({ ...loginForm, name: e.target.value })}
                        style={{ padding: '0.65rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: 8, width: '100%', fontSize: '0.9rem', fontFamily: 'var(--font-sans)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>사업번호</label>
                      <input type="text" placeholder="사업번호를 입력하세요" value={loginForm.projectNumber}
                        onChange={e => setLoginForm({ ...loginForm, projectNumber: e.target.value })}
                        style={{ padding: '0.65rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: 8, width: '100%', fontSize: '0.9rem', fontFamily: 'var(--font-sans)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>비밀번호</label>
                      <input type="password" placeholder="비밀번호를 입력하세요" value={loginForm.password}
                        onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        style={{ padding: '0.65rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: 8, width: '100%', fontSize: '0.9rem', fontFamily: 'var(--font-sans)' }} />
                    </div>
                  </div>
                  <button className="btn-upload" style={{ width: '100%', marginTop: '1.25rem' }} onClick={handleLogin}>로그인</button>
                </>
              ) : (
                <>
                  {!adminAuthed ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem 0' }}>
                        관리자 비밀번호를 입력하세요.
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>관리자 비밀번호</label>
                        <input type="password" placeholder="관리자 비밀번호" value={adminPassword}
                          onChange={e => setAdminPassword(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAdminAuth()}
                          style={{ padding: '0.65rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: 8, width: '100%', fontSize: '0.9rem', fontFamily: 'var(--font-sans)' }} />
                      </div>
                      <button className="btn-upload" style={{ width: '100%' }} onClick={handleAdminAuth}>인증</button>
                    </div>
                  ) : (
                    <>
                      {/* 관리자 서브 탭 */}
                      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                        {(['list', 'create'] as const).map(v => (
                          <button key={v} onClick={() => { setAuthError(''); setAdminView(v); }}
                            style={{
                              flex: 1, padding: '0.6rem', border: 'none', background: 'none', cursor: 'pointer',
                              fontWeight: 700, fontSize: '0.85rem',
                              color: adminView === v ? 'var(--primary)' : 'var(--text-muted)',
                              borderBottom: adminView === v ? '2px solid var(--primary)' : '2px solid transparent',
                            }}>
                            {v === 'list' ? `사업 목록 (${adminProjects.length})` : '새 사업 생성'}
                          </button>
                        ))}
                      </div>

                      {adminView === 'create' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>사업번호</label>
                            <input type="text" placeholder="사업번호 (로그인 시 사용)" value={adminForm.projectNumber}
                              onChange={e => setAdminForm({ ...adminForm, projectNumber: e.target.value })}
                              style={{ padding: '0.65rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: 8, width: '100%', fontSize: '0.9rem', fontFamily: 'var(--font-sans)' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>비밀번호</label>
                            <input type="password" placeholder="비밀번호 (로그인 시 사용)" value={adminForm.password}
                              onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                              style={{ padding: '0.65rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: 8, width: '100%', fontSize: '0.9rem', fontFamily: 'var(--font-sans)' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>사업명</label>
                            <input type="text" placeholder="사업명을 입력하세요" value={adminForm.projectName}
                              onChange={e => setAdminForm({ ...adminForm, projectName: e.target.value })}
                              onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
                              style={{ padding: '0.65rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: 8, width: '100%', fontSize: '0.9rem', fontFamily: 'var(--font-sans)' }} />
                          </div>
                          <button className="btn-upload" style={{ width: '100%' }} onClick={handleCreateProject}>사업 생성</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '380px', overflowY: 'auto' }}>
                          {adminProjects.length === 0 && (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>생성된 사업이 없습니다.</div>
                          )}
                          {/* 활성 사업 */}
                          {adminProjects.filter(p => !p.deleted_at).map(p => (
                            <div key={p.id} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 10, border: editingProjectId === p.id ? '1px solid var(--primary)' : '1px solid var(--border-color)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.project_name}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>번호: {p.project_number} · {new Date(p.created_at).toLocaleDateString()}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                  <button onClick={() => editingProjectId === p.id ? setEditingProjectId(null) : handleEditProject(p)}
                                    style={{ padding: '0.25rem 0.6rem', background: editingProjectId === p.id ? '#e0e7ff' : '#f1f5f9', color: editingProjectId === p.id ? 'var(--primary)' : '#64748b', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                    {editingProjectId === p.id ? '닫기' : '수정'}
                                  </button>
                                  <button onClick={() => handleDeleteProject(p.id, p.project_name)}
                                    style={{ padding: '0.25rem 0.6rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                    삭제
                                  </button>
                                </div>
                              </div>
                              {editingProjectId === p.id && (
                                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                                  <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>사업번호</label>
                                    <input
                                      type="text"
                                      value={editForm.projectNumber}
                                      onChange={e => setEditForm({ ...editForm, projectNumber: e.target.value })}
                                      style={{ padding: '0.5rem 0.65rem', border: '1px solid var(--border-color)', borderRadius: 7, width: '100%', fontSize: '0.85rem', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>새 비밀번호 <span style={{ fontWeight: 400 }}>(비워두면 변경 안 함)</span></label>
                                    <input
                                      type="password"
                                      placeholder="변경할 비밀번호 입력"
                                      value={editForm.password}
                                      onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                      style={{ padding: '0.5rem 0.65rem', border: '1px solid var(--border-color)', borderRadius: 7, width: '100%', fontSize: '0.85rem', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
                                    />
                                  </div>
                                  <button onClick={() => handleSaveEditProject(p.id)}
                                    style={{ padding: '0.45rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 7, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                                    저장
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                          {/* 삭제된 사업 히스토리 */}
                          {adminProjects.some(p => p.deleted_at) && (
                            <>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '0.5rem', padding: '0.25rem 0', borderTop: '1px dashed var(--border-color)' }}>
                                삭제된 사업 (히스토리)
                              </div>
                              {adminProjects.filter(p => p.deleted_at).map(p => (
                                <div key={p.id} style={{ padding: '0.75rem', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca', opacity: 0.85 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ef4444', textDecoration: 'line-through' }}>{p.project_name}</div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>번호: {p.project_number} · 삭제: {new Date(p.deleted_at!).toLocaleDateString()}</div>
                                    </div>
                                    <button onClick={() => handleRestoreProject(p.id, p.project_name)}
                                      style={{ padding: '0.25rem 0.6rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b981', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                      복원
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedTower && (
        <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && !selectedPointId && setSelectedTowerId(null)}>
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h2>{selectedTower.name} 접지상세 ({currentCircuit}회선)</h2>
              <button className="modal-close" onClick={() => setSelectedTowerId(null)}>✕</button>
            </div>
            <div className="modal-body">
              {selectedTower.points.filter(p => p.circuit === currentCircuit).map(pt => {
                const latest = pt.history[0];
                return (
                  <div key={pt.id} className="point-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{pt.name}</span>
                      <span className={`status-badge ${pt.status}`}>{pt.status}</span>
                    </div>
                    {latest && latest.userName && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        관리: {latest.affiliation} {latest.userName} ({new Date(latest.timestamp).toLocaleString()})
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {latest && <button className="photo-btn" onClick={() => setViewingPhoto({ towerId: selectedTower.id, pointId: pt.id })}>기록보기</button>}
                      <button className="photo-btn primary" onClick={() => { setSelectedPointId(pt.id); setUploadType('install'); setUploadTowerId(selectedTower.id); }}>설치</button>
                      {pt.status === 'grounding' && <button className="photo-btn" style={{ borderColor: '#10b981', color: '#10b981' }} onClick={() => { setSelectedPointId(pt.id); setUploadType('remove'); setUploadTowerId(selectedTower.id); }}>철거</button>}
                      <button className="photo-btn" onClick={() => toggleExempt(selectedTower.id, pt.id, pt.status)} style={{ background: pt.status === 'exempt' ? '#ef4444' : '#f1f5f9', color: pt.status === 'exempt' ? 'white' : 'inherit' }}>
                        {pt.status === 'exempt' ? '비대상 해제' : '비대상 체크'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Photo history Modal ── */}
      {viewingPhoto && (() => {
        const tower = towers.find(t => t.id === viewingPhoto.towerId);
        const point = tower?.points.find(p => p.id === viewingPhoto.pointId);
        const history = point?.history || [];
        return (
          <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && setViewingPhoto(null)}>
            <div className="modal-content glass-card">
              <div className="modal-header">
                <h2>{tower?.name} {point?.name} 업로드 기록</h2>
                <button className="modal-close" onClick={() => setViewingPhoto(null)}>✕</button>
              </div>
              <div className="modal-body">
                {history.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>기록이 없습니다.</p>
                ) : history.map((h, i) => (
                  <div key={i} style={{ border: '1px solid var(--border-color)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                    {h.photo && <img src={h.photo} style={{ width: '100%', display: 'block' }} alt="접지사진" />}
                    <div style={{ padding: '0.75rem', background: '#f8fafc' }}>
                      <div style={{ fontWeight: 700, color: h.status === 'grounding' ? 'var(--status-grounding)' : h.status === 'removed' ? 'var(--status-removed)' : 'var(--text-muted)' }}>
                        {h.status === 'grounding' ? '접지 설치' : h.status === 'removed' ? '접지 철거' : h.status}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {h.affiliation} {h.userName} &middot; {new Date(h.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Upload Modal ── */}
      {selectedPointId && (
        <div className="modal-overlay active">
          <div className="modal-content glass-card" style={{ maxWidth: 400, margin: 'auto' }}>
            <div className="modal-header"><h2>사진 업로드</h2></div>
            <div className="upload-body">
              <div style={{ marginBottom: 15, padding: '0.8rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: '0.85rem', color: '#b91c1c', lineHeight: 1.4 }}>
                <strong>⚠️ 주의사항</strong><br/>
                현재 <b>HEIF/HEIC 파일은 업로드할 수 없습니다.</b><br/>
                아이폰 사용자이신 경우, 카메라 설정에서 포맷을 <b>"가장 호환성 높은"</b>으로 변경하시거나 <b>일반 JPEG 사진</b>만 올려주세요.
              </div>
              {/* disabled 제거: iOS WebKit에서 disabled 시 File 참조가 무효화됨 */}
              <input type="file" accept="image/jpeg, image/png, image/webp" onClick={(e) => { (e.target as any).value = ''; }} onChange={handleFileSelect} />
              {pendingPhotoPreview && <img src={pendingPhotoPreview} style={{ maxWidth: '100%', marginTop: 10 }} />}
              <div className="upload-actions" style={{ marginTop: 20 }}>
                <button className="btn-cancel" onClick={() => { setSelectedPointId(null); setPendingPhotoPreview(null); setUploadTowerId(null); }} disabled={isLoading}>취소</button>
                <button className="btn-upload" onClick={handlePhotoUpload} disabled={!pendingPhotoPreview || isLoading}>
                  {isLoading ? '업로드 중...' : '업로드'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings Modal ── */}
      {showSettings && (
        <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && setShowSettings(false)}>
          <div className="modal-content glass-card" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2>설정</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={handleLogout}
                  style={{ padding: '0.35rem 0.75rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  로그아웃
                </button>
                <button className="modal-close" onClick={() => setShowSettings(false)}>✕</button>
              </div>
            </div>

            {/* Tab navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 1.25rem' }}>
              {(['project', 'towers'] as const).map(tab => (
                <button key={tab} onClick={() => { setSettingsError(''); setSettingsTab(tab); }}
                  style={{
                    flex: 1, padding: '0.75rem', border: 'none', background: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: '0.9rem',
                    color: settingsTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                    borderBottom: settingsTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                    transition: 'all 0.2s',
                  }}>
                  {tab === 'project' ? '프로젝트 정보' : '철탑 목록'}
                </button>
              ))}
            </div>

            <div className="modal-body" style={{ gap: '1rem' }}>
              {settingsError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.75rem', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
                  {settingsError}
                </div>
              )}

              {settingsTab === 'project' ? (
                <>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>사업명</label>
                    <input
                      type="text"
                      value={settingsDraft.projectName}
                      onChange={e => setSettingsDraft({ ...settingsDraft, projectName: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'var(--font-sans)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>공사구간</label>
                    <input
                      type="text"
                      value={settingsDraft.constructionSection}
                      onChange={e => setSettingsDraft({ ...settingsDraft, constructionSection: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'var(--font-sans)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>선로명</label>
                    <input
                      type="text"
                      value={settingsDraft.lineName}
                      onChange={e => setSettingsDraft({ ...settingsDraft, lineName: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'var(--font-sans)' }}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Tower list generator */}
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>철탑 리스트 생성</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>접두어</label>
                        <input type="text" placeholder="예: No." value={genPrefix} onChange={e => setGenPrefix(e.target.value)}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>시점번호</label>
                        <input type="number" placeholder="1" value={genStart} onChange={e => setGenStart(e.target.value)}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>종점번호</label>
                        <input type="number" placeholder="25" value={genEnd} onChange={e => setGenEnd(e.target.value)}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>접미어</label>
                        <input type="text" placeholder="호" value={genSuffix} onChange={e => setGenSuffix(e.target.value)}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.85rem' }} />
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateTowerList}
                      style={{ width: '100%', padding: '0.6rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                      리스트 생성
                    </button>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                      ※ 기존 목록을 완전히 대체합니다.
                    </div>
                  </div>

                  {/* Current tower list */}
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                      현재 철탑 목록 ({towerConfigsDraft.length}기)
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {towerConfigsDraft.map((cfg, idx) => {
                        const tower = towers.find(t => t.id === `tower-${idx}`);
                        const hasData = tower && (tower.points.some(p => p.history.length > 0) || tower.points.some(p => p.status === 'exempt'));
                        return (
                          <div key={idx}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.6rem', background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 24 }}>{idx + 1}</span>
                              <input
                                type="text"
                                value={cfg.name}
                                onChange={e => {
                                  const updated = [...towerConfigsDraft];
                                  updated[idx] = { ...updated[idx], name: e.target.value };
                                  setTowerConfigsDraft(updated);
                                }}
                                style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: 6, padding: '0.3rem 0.5rem', fontSize: '0.85rem', fontFamily: 'var(--font-sans)' }}
                              />
                              {hasData && (
                                <span title="데이터 있음" style={{ fontSize: '0.75rem', color: '#f59e0b' }}>📷</span>
                              )}
                              <button
                                onClick={() => setInsertAfterIdx(insertAfterIdx === idx ? null : idx)}
                                title="이 위치 뒤에 삽입"
                                style={{ padding: '0.25rem 0.4rem', background: insertAfterIdx === idx ? 'var(--primary)' : '#e2e8f0', color: insertAfterIdx === idx ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                                +
                              </button>
                              <button
                                onClick={() => handleRemoveTower(idx)}
                                title="철탑 제거"
                                style={{ padding: '0.25rem 0.4rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}>
                                ✕
                              </button>
                            </div>
                            {insertAfterIdx === idx && (
                              <div style={{ marginTop: '0.25rem', padding: '0.75rem', background: 'rgba(37,99,235,0.05)', border: '1px dashed var(--primary)', borderRadius: 8 }}>
                                {/* 삽입 모드 전환 */}
                                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
                                  {(['single', 'range'] as const).map(m => (
                                    <button key={m} onClick={() => setInsertMode(m)}
                                      style={{ flex: 1, padding: '0.3rem', border: `1px solid ${insertMode === m ? 'var(--primary)' : 'var(--border-color)'}`, borderRadius: 6, background: insertMode === m ? 'var(--primary)' : 'white', color: insertMode === m ? 'white' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                                      {m === 'single' ? '1기 삽입' : '범위 삽입'}
                                    </button>
                                  ))}
                                </div>
                                {insertMode === 'single' ? (
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input type="text" placeholder="철탑명 (예: 7.1호, 이천S/S)" value={insertSingleName}
                                      onChange={e => setInsertSingleName(e.target.value)}
                                      onKeyDown={e => e.key === 'Enter' && handleInsertTowers(idx)}
                                      style={{ flex: 1, padding: '0.35rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.85rem', fontFamily: 'var(--font-sans)' }} />
                                    <button onClick={() => handleInsertTowers(idx)}
                                      style={{ padding: '0.35rem 0.75rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                                      삽입
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <input type="number" placeholder="시점" value={insertStartNum} onChange={e => setInsertStartNum(e.target.value)}
                                      style={{ width: 64, padding: '0.35rem', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.8rem' }} />
                                    <span style={{ fontSize: '0.75rem' }}>~</span>
                                    <input type="number" placeholder="종점" value={insertEndNum} onChange={e => setInsertEndNum(e.target.value)}
                                      style={{ width: 64, padding: '0.35rem', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.8rem' }} />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>호</span>
                                    <button onClick={() => handleInsertTowers(idx)}
                                      style={{ padding: '0.35rem 0.75rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                                      삽입
                                    </button>
                                  </div>
                                )}
                                <button onClick={() => setInsertAfterIdx(null)}
                                  style={{ marginTop: '0.4rem', padding: '0.25rem 0.5rem', background: '#f1f5f9', border: 'none', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                  취소
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setShowSettings(false)}>취소</button>
                <button className="btn-upload" style={{ flex: 2 }} onClick={saveSettings}>저장</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Bar */}
      {isLoading && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 9999, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div>{uploadMessage || '처리 중입니다... 잠시만 기다려주세요.'}</div>
          <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: 'var(--primary)', animation: 'loading 1.5s infinite ease-in-out' }} />
          </div>
        </div>
      )}
      <div id="toast" className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
      <style jsx>{`
        @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>
    </>
  );
}
