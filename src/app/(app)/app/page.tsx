'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { loginToProject, createProject, getAdminProjects, deleteProject, purgeProject, restoreProject, updateProjectCredentials, uploadGrounding, getLatestGrounding, getProjectPhotos, getProjectStatistics, getPointPhotoHistory, getTowerHistory, uploadRegistry, getRegistries, deleteRegistry, deleteGroundingLog, deleteGroundingLogById, togglePointExempt, bulkToggleExempt, getRegistryData, getProjectSettings, saveProjectSettings } from '../../actions';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';

import { AdminProject, User, Project, HistoryItem, Point, Tower, Registry, TowerConfig, LineConfig } from '../../../lib/types';
import { buildPoints, migrateToLineConfigs, genLineId } from '../../../lib/utils';
import GroundingMap from '../../../components/GroundingMap';
import LocationPickerModal from '../../../components/LocationPickerModal';
import { useKakaoLoader } from 'react-kakao-maps-sdk';

const SESSION_KEY = 'groundcheck_session';

export default function GroundCheckApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'towers' | 'map' | 'stats'>('dashboard');
  const [statsData, setStatsData] = useState<any>(null);
  const [currentCircuit, setCurrentCircuit] = useState(1);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [registries, setRegistries] = useState<Registry[]>([]);

  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [navTowerId, setNavTowerId] = useState<string | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [locationPickerTowerId, setLocationPickerTowerId] = useState<string | null>(null);
  const [towerAddress, setTowerAddress] = useState<string>('');
  const [uploadTowerId, setUploadTowerId] = useState<string | null>(null);
  const [selectedTowerIds, setSelectedTowerIds] = useState<string[]>([]);
  const [uploadType, setUploadType] = useState<'install' | 'remove'>('install');

  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(null);
  const [pendingGPS, setPendingGPS] = useState<{ latitude: number; longitude: number; accuracy: number | null } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'pending' | 'ok' | 'denied' | 'unsupported' | 'error'>('idle');
  const [gpsSource, setGpsSource] = useState<'exif' | 'browser' | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<{ towerId: string; pointId: string } | null>(null);
  const [viewingHistory, setViewingHistory] = useState<HistoryItem[] | null>(null);
  const [viewingHistoryLoading, setViewingHistoryLoading] = useState(false);
  // 타워 전체 이력 타임라인
  const [timelineTowerId, setTimelineTowerId] = useState<string | null>(null);
  const [timelineData, setTimelineData] = useState<HistoryItem[] | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  // 보고서 다운로드
  const [exportingReport, setExportingReport] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pendingUndo, setPendingUndo] = useState<{ logIds: string[]; message: string } | null>(null);
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

  // Line switching (dashboard/towers view)
  const [currentLineId, setCurrentLineId] = useState<string>('');

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState({ projectName: '', constructionSection: '', lineName: '' });

  // Line configs in settings
  const [lineConfigsDraft, setLineConfigsDraft] = useState<LineConfig[]>([]);
  const [settingsLineId, setSettingsLineId] = useState<string>('');
  const [newLineName, setNewLineName] = useState('');
  // Derived: the towers array of the currently-edited line in settings
  const activeSettingsLine = lineConfigsDraft.find(l => l.id === settingsLineId);
  const towerConfigsDraft: TowerConfig[] = activeSettingsLine?.towers || [];
  const setTowerConfigsDraft = (
    next: TowerConfig[] | ((prev: TowerConfig[]) => TowerConfig[])
  ) => {
    setLineConfigsDraft(prev => prev.map(l =>
      l.id === settingsLineId
        ? { ...l, towers: typeof next === 'function' ? (next as any)(l.towers) : next }
        : l
    ));
  };
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
    if (!proj || !currentUser) return;
    try {
      // Fetch fresh settings from DB
      const freshSettings = await getProjectSettings(proj.id, currentUser.id);
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

      // 여러 선로 지원: tower_configs(jsonb)를 LineConfig[]로 정규화
      const rawConfigs = freshSettings?.towerConfigs ?? proj.towerConfigs;
      const lineConfigs: LineConfig[] = migrateToLineConfigs(rawConfigs);

      const logs = await getLatestGrounding(Date.now(), proj.id, currentUser.id);
      const regsRes = await fetch('/api/registries?t=' + Date.now() + '&projectId=' + proj.id);
      const regs = await regsRes.json();
      setRegistries(regs || []);

      const builtTowers: Tower[] = [];
      lineConfigs.forEach(line => {
        line.towers.forEach((cfg, i) => {
          builtTowers.push({
            id: `${line.id}-tower-${i}`,
            number: cfg.name,
            name: cfg.name,
            lineId: line.id,
            points: buildPoints(line.id, i, logs),
          });
        });
      });
      setTowers(builtTowers);

      // 활성 선로가 비었거나 더 이상 존재하지 않으면 첫 선로로 리셋
      setCurrentLineId(prev => {
        if (prev && lineConfigs.find(l => l.id === prev)) return prev;
        return lineConfigs[0]?.id || '';
      });
    } catch (e: any) {
      console.error('Failed to fetch data', e);
    }
  }, [currentProject?.id, currentUser?.id]);

  useEffect(() => {
    if (currentView === 'stats' && currentProject && currentUser) {
      getProjectStatistics(currentProject.id, currentUser.id).then(setStatsData);
    }
  }, [currentView, currentProject, currentUser]);

  const showToast = (msg: string, undoAction?: { logIds: string[] }) => {
    setToastMsg(msg);
    if (undoAction) {
      setPendingUndo({ logIds: undoAction.logIds, message: msg });
    } else {
      setPendingUndo(null);
    }
    // 토스트는 5초 동안 유지 (취소 기회 제공)
    setTimeout(() => {
      setToastMsg(prev => prev === msg ? '' : prev);
      setPendingUndo(prev => (prev && prev.message === msg) ? null : prev);
    }, 5000);
  };

  const handleUndo = async () => {
    if (!pendingUndo || !currentUser || !currentProject) return;
    const { logIds } = pendingUndo;
    setIsLoading(true);
    setUploadMessage('작업 취소 중...');
    try {
      for (const id of logIds) {
        await deleteGroundingLogById(id, currentProject.id, currentUser.id);
      }
      setPendingUndo(null);
      setToastMsg('');
      await refreshData();
      showToast('작업이 취소되었습니다.');
    } catch (e: any) {
      alert('실행 취소 실패: ' + e.message);
    } finally {
      setIsLoading(false);
      setUploadMessage('');
    }
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
    if (tower.lineId !== currentLineId) return;
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

  // GPS 캡처 진행 상황을 ref로 유지 (closure 문제 회피)
  const gpsPromiseRef = useRef<Promise<{ latitude: number; longitude: number; accuracy: number | null } | null> | null>(null);

  // 브라우저 Geolocation API로 현재 위치 캡처 (EXIF GPS 없을 때 폴백)
  const captureBrowserGPS = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('unsupported');
      gpsPromiseRef.current = Promise.resolve(null);
      return;
    }
    setGpsStatus('pending');
    gpsPromiseRef.current = new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const v = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy };
          setPendingGPS(v);
          setGpsSource('browser');
          setGpsStatus('ok');
          resolve(v);
        },
        (err) => {
          console.warn('[GPS]', err);
          setGpsStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
      );
    });
  };

  // 파일 EXIF에서 GPS 추출. 성공하면 state 세팅 후 값 반환, 없으면 null.
  const extractExifGPS = async (file: File): Promise<{ latitude: number; longitude: number; accuracy: number | null } | null> => {
    try {
      const exifr = (await import('exifr')).default;
      const gps = await exifr.gps(file);
      if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
        const v = { latitude: gps.latitude, longitude: gps.longitude, accuracy: null };
        setPendingGPS(v);
        setGpsSource('exif');
        setGpsStatus('ok');
        gpsPromiseRef.current = Promise.resolve(v);
        return v;
      }
    } catch (e) {
      console.warn('[EXIF GPS]', e);
    }
    return null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setUploadMessage('이미지 처리 중...');
    setPendingGPS(null);
    setGpsSource(null);
    setGpsStatus('idle');

    // 이미지 처리 + EXIF GPS 추출 병렬 실행
    const [dataUrl, exifGps] = await Promise.allSettled([
      processImageFile(file),
      extractExifGPS(file),
    ]);

    if (dataUrl.status === 'rejected') {
      console.error('[handleFileSelect]', dataUrl.reason);
      alert('이미지 처리 실패: ' + (dataUrl.reason?.message || '알 수 없는 오류'));
      if (e.target) e.target.value = '';
      setIsLoading(false);
      setUploadMessage('');
      return;
    }
    setPendingPhotoPreview(dataUrl.value);

    // EXIF에 GPS가 없으면 브라우저 위치로 폴백 (non-blocking)
    if (exifGps.status === 'fulfilled' && !exifGps.value) {
      captureBrowserGPS();
    }

    setIsLoading(false);
    setUploadMessage('');
  };


  const handlePhotoUpload = async () => {
    if (!currentUser || !currentProject) return setShowAuthModal(true);
    if (!uploadTowerId || !selectedPointId || !pendingPhotoPreview) return;

    // 캡처 (state reset 이후에도 쓰기 위해)
    const targetTowerId = uploadTowerId;
    const targetPointId = selectedPointId;
    const newStatus: 'grounding' | 'removed' = uploadType === 'install' ? 'grounding' : 'removed';
    const photoPreview = pendingPhotoPreview;

    // GPS 캡처: 이미 성공했으면 그 값 사용. 아직 pending이면 최대 3초 대기.
    let gps: { latitude: number; longitude: number; accuracy: number | null } | null = pendingGPS;
    if (!gps && gpsPromiseRef.current) {
      try {
        gps = await Promise.race([
          gpsPromiseRef.current,
          new Promise<null>(r => setTimeout(() => r(null), 3000)),
        ]);
      } catch { gps = null; }
    }

    setIsLoading(true);
    setUploadMessage('파일 전송 중...');
    try {
      const resp = await uploadGrounding({
        towerId: targetTowerId,
        pointId: targetPointId,
        status: newStatus,
        photoData: photoPreview,
        userId: currentUser.id,
        projectId: currentProject.id,
        latitude: gps?.latitude ?? null,
        longitude: gps?.longitude ?? null,
        locationAccuracy: gps?.accuracy ?? null,
      });
      if (resp.success) {
        // 낙관적 업데이트: refreshData 없이 로컬 state만 갱신
        setTowers(prev => prev.map(t =>
          t.id === targetTowerId
            ? {
                ...t,
                points: t.points.map(p =>
                  p.id === targetPointId
                    ? {
                        ...p,
                        status: newStatus,
                        history: [{
                          status: newStatus,
                          timestamp: Date.now(),
                          photo: photoPreview,
                          userName: currentUser.name,
                          affiliation: currentUser.affiliation,
                          latitude: gps?.latitude ?? null,
                          longitude: gps?.longitude ?? null,
                          locationAccuracy: gps?.accuracy ?? null,
                        }, ...p.history],
                      }
                    : p
                ),
              }
            : t
        ));
        setPendingPhotoPreview(null);
        setSelectedPointId(null);
        setUploadTowerId(null);
        setPendingGPS(null);
        setGpsStatus('idle');
        setGpsSource(null);
        showToast('업로드가 완료되었습니다.' + (gps ? ' 📍 위치 기록됨' : ''), { logIds: [(resp as any).logId as string] });
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
    // 안내 confirm 제거
    const makeExempt = currentStatus !== 'exempt';
    const newStatus: 'exempt' | 'none' = makeExempt ? 'exempt' : 'none';
    setIsLoading(true);
    try {
      const resp = await togglePointExempt(tId, pId, currentUser.id, makeExempt, currentProject.id);
      if (resp.success) {
        // 낙관적 업데이트: 해당 포인트만 상태 변경
        setTowers(prev => prev.map(t =>
          t.id === tId
            ? {
                ...t,
                points: t.points.map(p =>
                  p.id === pId ? { ...p, status: newStatus } : p
                ),
              }
            : t
        ));
        showToast(makeExempt ? '비대상으로 설정되었습니다.' : '비대상이 해제되었습니다.', { logIds: [(resp as any).logId as string] });
      } else {
        alert('실패: ' + resp.error);
      }
    } catch (e: any) {
      alert('전환 에러: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkExempt = async (makeExempt: boolean) => {
    if (!currentUser || !currentProject || selectedTowerIds.length === 0) return;
    if (!confirm(`${selectedTowerIds.length}기의 철탑을 일괄 ${makeExempt ? '비대상 설정' : '해제'} 하시겠습니까?`)) return;
    setIsLoading(true);
    try {
      const selectedTowers = towers.filter(t => selectedTowerIds.includes(t.id));
      const entries = selectedTowers.flatMap(t => 
        t.points.map(p => ({ towerId: t.id, pointId: p.id }))
      );

      const resp = await bulkToggleExempt(entries, currentUser.id, makeExempt, currentProject.id);
      if (resp.success) {
        await refreshData();
        setSelectedTowerIds([]);
        showToast(`${selectedTowerIds.length}기 일괄 처리가 완료되었습니다.`, { logIds: resp.logIds || [] });
      } else {
        alert('일괄 처리 실패: ' + resp.error);
      }
    } catch (e: any) {
      alert('오류: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 보고서 Excel 다운로드: 모든 선로 × 철탑 × 회선 × 상 × 주/보접지 포인트 기준.
  const handleExportReport = async () => {
    if (!currentProject) return;
    if (exportingReport) return;
    setExportingReport(true);
    try {
      const lineConfigs: LineConfig[] = migrateToLineConfigs(currentProject.towerConfigs);
      const lineNameById = new Map(lineConfigs.map(l => [l.id, l.name]));
      const rows: any[] = [];
      const statusKor: Record<string, string> = {
        none: '미등록', grounding: '접지중', removed: '철거완료', exempt: '비대상',
      };
      for (const t of towers) {
        for (const pt of t.points) {
          const latest = pt.history[0];
          rows.push({
            '선로명': lineNameById.get(t.lineId) || '',
            '철탑번호': t.name,
            '회선': pt.circuit,
            '상': pt.phase.toUpperCase(),
            '접지구분': pt.groundingType === 'main' ? '주접지' : '보조접지',
            '상태': statusKor[pt.status] || pt.status,
            '작업자': latest?.userName || '',
            '소속': latest?.affiliation || '',
            '작업일시': latest ? new Date(latest.timestamp).toLocaleString() : '',
            '위도': latest?.latitude ?? '',
            '경도': latest?.longitude ?? '',
            '정확도(m)': latest?.locationAccuracy != null ? Math.round(latest.locationAccuracy) : '',
          });
        }
      }
      const ws = XLSX.utils.json_to_sheet(rows);
      // 컬럼 폭 보정
      ws['!cols'] = [
        { wch: 14 }, { wch: 10 }, { wch: 5 }, { wch: 4 }, { wch: 8 },
        { wch: 9 }, { wch: 10 }, { wch: 12 }, { wch: 20 },
        { wch: 11 }, { wch: 11 }, { wch: 9 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '접지현황');
      const today = new Date().toISOString().slice(0, 10);
      const safeName = (currentProject.projectName || currentProject.projectNumber || 'project').replace(/[\\/:*?"<>|]/g, '_');
      XLSX.writeFile(wb, `${safeName}_접지현황_${today}.xlsx`);
      showToast('보고서가 다운로드되었습니다.');
    } catch (e: any) {
      alert('보고서 생성 실패: ' + (e?.message || e));
    } finally {
      setExportingReport(false);
    }
  };

  const handleExportPdf = async () => {
    if (!currentProject || !currentUser) return;
    setExportingPdf(true);
    try {
      const photosRes = await getProjectPhotos(currentProject.id, currentUser.id);
      if (!photosRes) throw new Error('사진 데이터를 가져오지 못했습니다.');

      const towerIndexMap = new Map(towers.map((t, i) => [t.id, i]));
      const sortedPhotos = [...(photosRes as any[])].sort((a, b) => {
        const tIdxA = towerIndexMap.get(a.tower_id) ?? 999;
        const tIdxB = towerIndexMap.get(b.tower_id) ?? 999;
        if (tIdxA !== tIdxB) return tIdxA - tIdxB;
        if (a.circuit !== b.circuit) return a.circuit - b.circuit;
        const phaseOrder = { a: 0, b: 1, c: 2 };
        const phaseA = phaseOrder[a.phase as 'a'|'b'|'c'] ?? 9;
        const phaseB = phaseOrder[b.phase as 'a'|'b'|'c'] ?? 9;
        if (phaseA !== phaseB) return phaseA - phaseB;
        return a.grounding_type === 'main' ? -1 : 1;
      });

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '-10000px';
      container.style.width = '800px';
      container.style.padding = '40px';
      container.style.background = 'white';
      container.style.fontFamily = 'sans-serif';
      document.body.appendChild(container);

      for (let i = 0; i < sortedPhotos.length; i += 2) {
        if (i > 0) doc.addPage();
        container.innerHTML = '';
        const pagePhotos = sortedPhotos.slice(i, i + 2);
        pagePhotos.forEach((item) => {
          const div = document.createElement('div');
          div.style.marginBottom = '40px';
          div.style.border = '2px solid #333';
          div.style.padding = '20px';
          const title = document.createElement('h2');
          title.style.margin = '0 0 15px 0';
          title.style.fontSize = '24px';
          title.innerText = `${item.tower_name} [${item.circuit}회선 ${item.phase.toUpperCase()}상 ${item.grounding_type === 'main' ? '주접지' : '보조접지'}] - ${item.status === 'grounding' ? '설치' : '철거'}`;
          div.appendChild(title);
          if (item.photo_data) {
            const img = document.createElement('img');
            img.src = item.photo_data;
            img.style.width = '100%';
            img.style.maxHeight = '450px';
            img.style.objectFit = 'contain';
            img.style.display = 'block';
            img.style.border = '1px solid #ddd';
            div.appendChild(img);
          }
          const info = document.createElement('div');
          info.style.marginTop = '15px';
          info.style.fontSize = '16px';
          info.style.color = '#555';
          info.innerText = `작업자: ${item.affiliation} ${item.user_name} | 일시: ${new Date(item.created_at).toLocaleString()}`;
          div.appendChild(info);
          container.appendChild(div);
        });
        const canvas = await html2canvas(container, { scale: 2 });
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, (canvas.height * pageWidth) / canvas.width);
      }
      doc.save(`${currentProject.projectName}_사진대지_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.removeChild(container);
      showToast('PDF 사진대지 다운로드가 시작되었습니다.');
    } catch (e: any) {
      alert('PDF 생성 오류: ' + e.message);
    } finally {
      setExportingPdf(false);
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
  const selectedPoint = selectedTower?.points.find(p => p.id === selectedPointId);

  const allPoints = towers.flatMap(t => t.points);
  const projTotalPoints = allPoints.filter(p => p.status !== 'exempt').length;
  const projGroundingCnt = allPoints.filter(p => p.status === 'grounding').length;
  const projRemovedCnt = allPoints.filter(p => p.status === 'removed').length;

  // ── Settings handlers ──────────────────────────────────────────

  const openSettings = () => {
    if (!currentProject) return;
    setSettingsDraft({
      projectName: currentProject.projectName,
      constructionSection: currentProject.constructionSection,
      lineName: currentProject.lineName,
    });
    const lineConfigs = migrateToLineConfigs(currentProject.towerConfigs);
    // 깊은 복사 후 세팅
    setLineConfigsDraft(lineConfigs.map(l => ({
      id: l.id,
      name: l.name,
      towers: l.towers.map(t => ({ ...t })),
    })));
    const activeId = currentLineId && lineConfigs.find(l => l.id === currentLineId)
      ? currentLineId
      : lineConfigs[0].id;
    setSettingsLineId(activeId);
    setNewLineName('');
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
      const resp = await saveProjectSettings(currentProject.id, currentUser!.id, settingsDraft, lineConfigsDraft);
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
    const tower = towers.find(t => t.id === `${settingsLineId}-tower-${idx}`);
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
        <button className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
          <svg style={{ width: '1.5rem', height: '1.5rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          <span className="btn-label">대시보드</span>
        </button>
        <button className={`nav-btn ${currentView === 'towers' ? 'active' : ''}`} onClick={() => setCurrentView('towers')}>
          <svg style={{ width: '1.5rem', height: '1.5rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          <span className="btn-label">철탑목록</span>
        </button>
        <button className={`nav-btn ${currentView === 'map' ? 'active' : ''}`} onClick={() => setCurrentView('map')}>
          <svg style={{ width: '1.5rem', height: '1.5rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="btn-label">지도보기</span>
        </button>
        <button className={`nav-btn ${currentView === 'stats' ? 'active' : ''}`} onClick={() => setCurrentView('stats')}>
          <svg style={{ width: '1.5rem', height: '1.5rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
          <span className="btn-label">공정관리</span>
        </button>
      </nav>

      {currentView === 'dashboard' && (
        <section className="view active">
          <div className="dashboard-container">
            {/* 선로 선택 */}
            {(() => {
              const lineConfigs: LineConfig[] = migrateToLineConfigs(currentProject?.towerConfigs);
              if (lineConfigs.length <= 1) return null;
              return (
                <div className="glass-card" style={{ padding: '0.9rem 1rem', marginBottom: '0.9rem', background: 'white' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>선로 선택</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {lineConfigs.map(l => (
                      <button key={l.id} onClick={() => setCurrentLineId(l.id)}
                        style={{
                          padding: '0.4rem 0.85rem',
                          border: `1px solid ${currentLineId === l.id ? 'var(--primary)' : 'var(--border-color)'}`,
                          borderRadius: 999,
                          background: currentLineId === l.id ? 'var(--primary)' : 'white',
                          color: currentLineId === l.id ? 'white' : 'var(--text-main)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}>
                        {l.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
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
                    <span style={{ fontWeight: 600 }}>{
                      migrateToLineConfigs(currentProject?.towerConfigs).find(l => l.id === currentLineId)?.name
                      || currentProject?.lineName || '-'
                    }</span>
                  </div>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>총 철탑수</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{towers.filter(t => t.lineId === currentLineId).length}기</span>
                </div>
              </div>
            </div>

            {/* 접지 현황 */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>접지 현황 ({currentCircuit}회선)</h3>
                <button
                  onClick={handleExportReport}
                  disabled={exportingReport || towers.length === 0}
                  style={{
                    padding: '0.4rem 0.8rem',
                    background: exportingReport ? '#e5e7eb' : '#10b981',
                    color: 'white', border: 'none', borderRadius: 8,
                    fontSize: '0.8rem', fontWeight: 600,
                    cursor: exportingReport || towers.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: towers.length === 0 ? 0.5 : 1,
                  }}
                >
                  {exportingReport ? '생성 중...' : '📊 보고서 다운로드'}
                </button>
              </div>
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
                          const dataUrl = await getRegistryData(reg.id, currentProject!.id, currentUser!.id);
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
                          try { await deleteRegistry(reg.id, currentProject!.id, currentUser!.id); refreshData(); } catch (e: any) { alert('오류: ' + e.message); }
                        }
                      }} style={{ padding: '4px 8px' }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {currentView === 'towers' && (
        <section className="view active">
          <div className="towers-container">
            {/* 선로 선택 */}
            {(() => {
              const lineConfigs: LineConfig[] = migrateToLineConfigs(currentProject?.towerConfigs);
              if (lineConfigs.length <= 1) return null;
              return (
                <div className="glass-card" style={{ padding: '0.8rem 1rem', marginBottom: '0.9rem', background: 'white' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>선로 선택</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {lineConfigs.map(l => (
                      <button key={l.id} onClick={() => setCurrentLineId(l.id)}
                        style={{
                          padding: '0.4rem 0.85rem',
                          border: `1px solid ${currentLineId === l.id ? 'var(--primary)' : 'var(--border-color)'}`,
                          borderRadius: 999,
                          background: currentLineId === l.id ? 'var(--primary)' : 'white',
                          color: currentLineId === l.id ? 'white' : 'var(--text-main)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}>
                        {l.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0 0.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {selectedTowerIds.length > 0 ? `${selectedTowerIds.length}기 선택됨` : '철탑 리스트'}
              </div>
              {selectedTowerIds.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleBulkExempt(true)} style={{ padding: '0.3rem 0.6rem', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 }}>일괄 비대상</button>
                  <button onClick={() => setSelectedTowerIds([])} style={{ padding: '0.3rem 0.6rem', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 }}>취소</button>
                </div>
              )}
            </div>

            <div className="tower-list">
              {towers.filter(t => t.lineId === currentLineId).map(tower => {
                const circuitPoints = tower.points.filter(p => p.circuit === currentCircuit);
                const isSelected = selectedTowerIds.includes(tower.id);
                return (
                  <div key={tower.id} 
                    className={`tower-item glass-card ${isSelected ? 'selected' : ''}`} 
                    style={{ border: isSelected ? '2px solid var(--primary)' : undefined }}
                    onClick={() => {
                      if (selectedTowerIds.length > 0) {
                        setSelectedTowerIds(prev => prev.includes(tower.id) ? prev.filter(id => id !== tower.id) : [...prev, tower.id]);
                      } else {
                        setSelectedTowerId(tower.id);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSelectedTowerIds(prev => prev.includes(tower.id) ? prev.filter(id => id !== tower.id) : [...prev, tower.id]);
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <div className="tower-number">{tower.name}</div>
                      {selectedTowerIds.length > 0 && (
                        <div style={{ width: 16, height: 16, borderRadius: 4, border: '1px solid var(--border-color)', background: isSelected ? 'var(--primary)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isSelected && <svg style={{ width: 12, height: 12, color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      )}
                    </div>
                    {/* A/B/C 3상 × 주/보 2개 = 6개 dot, 상별로 묶음 */}
                    <div className="status-dots" style={{ display: 'flex', gap: '0.5rem' }}>
                      {(['a', 'b', 'c'] as const).map(phase => {
                        const main = circuitPoints.find(p => p.phase === phase && p.groundingType === 'main');
                        const sub  = circuitPoints.find(p => p.phase === phase && p.groundingType === 'sub');
                        const renderDot = (p: typeof main, title: string) => {
                          if (p?.status === 'exempt') {
                            return (
                              <span title={title} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 10, height: 10, fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', lineHeight: 1 }}>✕</span>
                            );
                          }
                          const cls = p?.status === 'grounding' ? 'grounding' : p?.status === 'removed' ? 'removed' : '';
                          return <div className={`status-circle ${cls}`} title={title} />;
                        };
                        return (
                          <div key={phase} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                              {renderDot(main, `${phase.toUpperCase()}상 주접지`)}
                              {renderDot(sub,  `${phase.toUpperCase()}상 보조접지`)}
                            </div>
                            <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 700 }}>{phase.toUpperCase()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {currentView === 'stats' && (
        <section className="view active">
          <div className="dashboard-container" style={{ paddingBottom: '2rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-main)' }}>📊 사업 진행 요약</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div style={{ padding: '1.25rem', background: '#eff6ff', borderRadius: 16, border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 600, marginBottom: '0.5rem' }}>전체 공정률</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)' }}>
                    {projTotalPoints > 0 ? (( (projGroundingCnt + projRemovedCnt) / projTotalPoints) * 100).toFixed(1) : 0}%
                  </div>
                </div>
                <div style={{ padding: '1.25rem', background: '#f0fdf4', borderRadius: 16, border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600, marginBottom: '0.5rem' }}>완료 개소</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10b981' }}>
                    {projGroundingCnt + projRemovedCnt} <small style={{ fontSize: '0.9rem', fontWeight: 600, color: '#6b7280' }}>/ {projTotalPoints}</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>📈 날짜별 작업 진행 추이</h3>
              <div style={{ width: '100%', height: 250 }}>
                {statsData?.dailyStats?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={statsData.dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" fontSize={10} tickFormatter={(str) => str.split('-').slice(1).join('/')} stroke="#94a3b8" />
                      <YAxis fontSize={10} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Line type="monotone" dataKey="count" name="작업수" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: '#fff' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                    작업 기록이 없습니다.
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>⚖️ 회선별 완료 현황 비교</h3>
              <div style={{ width: '100%', height: 200 }}>
                {(() => {
                  const c1Done = towers.flatMap(t => t.points).filter(p => p.circuit === 1 && (p.status === 'grounding' || p.status === 'removed')).length;
                  const c1Total = towers.flatMap(t => t.points).filter(p => p.circuit === 1 && p.status !== 'exempt').length;
                  const c2Done = towers.flatMap(t => t.points).filter(p => p.circuit === 2 && (p.status === 'grounding' || p.status === 'removed')).length;
                  const c2Total = towers.flatMap(t => t.points).filter(p => p.circuit === 2 && p.status !== 'exempt').length;
                  const barData = [{ name: '1회선', done: c1Done, total: c1Total }, { name: '2회선', done: c2Done, total: c2Total }];
                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} layout="vertical" margin={{ left: -20, right: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" fontSize={12} stroke="#475569" fontWeight={700} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="done" name="완료" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
                        <Bar dataKey="total" name="전체" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>
      )}

      {currentView === 'map' && (
        <section className="view active">
          <div className="dashboard-container">
            {/* 선로 선택 */}
            {(() => {
              const lineConfigs: LineConfig[] = migrateToLineConfigs(currentProject?.towerConfigs);
              if (lineConfigs.length <= 1) return null;
              return (
                <div className="glass-card" style={{ padding: '0.9rem 1rem', marginBottom: '0.9rem', background: 'white' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>선로 선택</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {lineConfigs.map(l => (
                      <button key={l.id} onClick={() => setCurrentLineId(l.id)}
                        style={{
                          padding: '0.4rem 0.85rem',
                          border: `1px solid ${currentLineId === l.id ? 'var(--primary)' : 'var(--border-color)'}`,
                          borderRadius: 999,
                          background: currentLineId === l.id ? 'var(--primary)' : 'white',
                          color: currentLineId === l.id ? 'white' : 'var(--text-main)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}>
                        {l.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="glass-card" style={{ padding: 0, height: 'calc(100vh - 280px)', minHeight: '400px', overflow: 'hidden', position: 'relative' }}>
              <GroundingMap 
                towers={towers.filter(t => t.lineId === currentLineId)} 
                currentCircuit={currentCircuit} 
                onTowerClick={(tId) => setNavTowerId(tId)} 
              />
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={async () => {
                    if (!currentProject) return;
                    setTimelineTowerId(selectedTower.id);
                    setTimelineData(null);
                    setTimelineLoading(true);
                    try {
                      const rows = await getTowerHistory(selectedTower.id, currentProject.id, currentUser!.id);
                      setTimelineData((rows as any[]).map(r => ({
                        status: r.status,
                        timestamp: new Date(r.created_at).getTime(),
                        photo: '',
                        userName: r.user_name,
                        affiliation: r.affiliation,
                        latitude: r.latitude ?? null,
                        longitude: r.longitude ?? null,
                        locationAccuracy: r.location_accuracy ?? null,
                        pointId: r.point_id,
                      })));
                    } catch { setTimelineData([]); }
                    finally { setTimelineLoading(false); }
                  }}
                  style={{ padding: '0.35rem 0.75rem', background: '#eff6ff', color: 'var(--primary)', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  📋 작업 이력
                </button>
                <button
                  onClick={() => setNavTowerId(selectedTower.id)}
                  style={{ padding: '0.35rem 0.75rem', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  🚗 길안내
                </button>
                <button className="modal-close" onClick={() => setSelectedTowerId(null)}>✕</button>
              </div>
            </div>
            <div className="modal-body">
              {/* A/B/C 각 상별 섹션 → 상 안에 주접지·보조접지 행 */}
              {(['a', 'b', 'c'] as const).map(phase => {
                const phasePoints = selectedTower.points.filter(
                  p => p.circuit === currentCircuit && p.phase === phase
                );
                return (
                  /* .point-section 재사용 금지 — 배경/테두리 충돌 방지 */
                  <div key={phase} style={{ marginBottom: '1.1rem', borderRadius: 12, border: '2px solid var(--primary)', overflow: 'hidden' }}>
                    {/* 상 헤더 */}
                    <div style={{ background: 'var(--primary)', color: 'white', fontWeight: 800, fontSize: '0.95rem', padding: '0.5rem 0.9rem' }}>
                      {phase.toUpperCase()}상
                    </div>
                    <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'white' }}>
                      {phasePoints.map(pt => {
                        const latest = pt.history[0];
                        const isMain = pt.groundingType === 'main';
                        const typeLabel = isMain ? '주접지' : '보조접지';
                        return (
                          <div key={pt.id} style={{
                            padding: '0.7rem 0.85rem',
                            background: isMain ? '#eff6ff' : '#f8fafc',
                            borderRadius: 9,
                            border: `1px solid ${isMain ? '#bfdbfe' : 'var(--border-color)'}`,
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isMain ? 'var(--primary)' : 'var(--text-main)' }}>
                                {typeLabel}
                              </span>
                              <span className={`status-badge ${pt.status}`}>{
                                pt.status === 'grounding' ? '접지중' :
                                pt.status === 'removed'   ? '철거완료' :
                                pt.status === 'exempt'    ? '비대상' : '미등록'
                              }</span>
                            </div>
                            {latest && latest.userName && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                관리: {latest.affiliation} {latest.userName} ({new Date(latest.timestamp).toLocaleString()})
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {latest && <button className="photo-btn" onClick={async () => {
                                if (!currentProject) return;
                                setViewingPhoto({ towerId: selectedTower.id, pointId: pt.id });
                                setViewingHistory(null);
                                setViewingHistoryLoading(true);
                                try {
                                  const rows = await getPointPhotoHistory(selectedTower.id, pt.id, currentProject.id, currentUser!.id);
                                  setViewingHistory((rows as any[]).map(r => ({
                                    status: r.status,
                                    timestamp: new Date(r.created_at).getTime(),
                                    photo: r.photo_data || '',
                                    userName: r.user_name,
                                    affiliation: r.affiliation,
                                    latitude: r.latitude ?? null,
                                    longitude: r.longitude ?? null,
                                    locationAccuracy: r.location_accuracy ?? null,
                                  })));
                                } catch { setViewingHistory([]); }
                                finally { setViewingHistoryLoading(false); }
                              }}>기록보기</button>}
                              <button className="photo-btn primary" onClick={() => { setSelectedPointId(pt.id); setUploadType('install'); setUploadTowerId(selectedTower.id); }}>설치</button>
                              {pt.status === 'grounding' && (
                                <button className="photo-btn" style={{ borderColor: '#10b981', color: '#10b981' }} onClick={() => { setSelectedPointId(pt.id); setUploadType('remove'); setUploadTowerId(selectedTower.id); }}>철거</button>
                              )}
                              <button className="photo-btn" onClick={() => toggleExempt(selectedTower.id, pt.id, pt.status)} style={{ background: pt.status === 'exempt' ? '#ef4444' : '#f1f5f9', color: pt.status === 'exempt' ? 'white' : 'inherit' }}>
                                {pt.status === 'exempt' ? '비대상 해제' : '비대상'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
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
        const history = viewingHistory || [];
        const closeModal = () => { setViewingPhoto(null); setViewingHistory(null); };
        return (
          <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && closeModal()}>
            <div className="modal-content glass-card">
              <div className="modal-header">
                <h2>{tower?.name} {point?.name} 업로드 기록</h2>
                <button className="modal-close" onClick={closeModal}>✕</button>
              </div>
              <div className="modal-body">
                {viewingHistoryLoading ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>기록 불러오는 중...</p>
                ) : history.length === 0 ? (
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
                      {h.latitude != null && h.longitude != null && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          📍 <a href={`https://www.google.com/maps?q=${h.latitude},${h.longitude}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                            {h.latitude.toFixed(5)}, {h.longitude.toFixed(5)}
                          </a>
                          {h.locationAccuracy != null && ` (±${Math.round(h.locationAccuracy)}m)`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Timeline (Tower full history) Modal ── */}
      {timelineTowerId && (() => {
        const tower = towers.find(t => t.id === timelineTowerId);
        const pointMap = new Map((tower?.points || []).map(p => [p.id, p]));
        const close = () => { setTimelineTowerId(null); setTimelineData(null); };
        return (
          <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && close()}>
            <div className="modal-content glass-card">
              <div className="modal-header">
                <h2>{tower?.name} 작업 이력 타임라인</h2>
                <button className="modal-close" onClick={close}>✕</button>
              </div>
              <div className="modal-body">
                {timelineLoading ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>이력 불러오는 중...</p>
                ) : !timelineData || timelineData.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>작업 이력이 없습니다.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {timelineData.map((h, i) => {
                      const pt = h.pointId ? pointMap.get(h.pointId) : null;
                      const label = pt
                        ? `${pt.circuit}회선 · ${pt.phase.toUpperCase()}상 ${pt.groundingType === 'main' ? '주접지' : '보조접지'}`
                        : (h.pointId || '');
                      const statusLabel =
                        h.status === 'grounding' ? '접지 설치' :
                        h.status === 'removed'   ? '접지 철거' :
                        h.status === 'exempt'    ? '비대상 지정' :
                        h.status === 'none'      ? '상태 초기화' : h.status;
                      const statusColor =
                        h.status === 'grounding' ? 'var(--status-grounding)' :
                        h.status === 'removed'   ? 'var(--status-removed)' : 'var(--text-muted)';
                      return (
                        <div key={i} style={{ padding: '0.75rem 0.9rem', border: '1px solid var(--border-color)', borderRadius: 10, background: '#f8fafc' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.3rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{label}</span>
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: statusColor }}>{statusLabel}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(h.timestamp).toLocaleString()} &middot; {h.affiliation} {h.userName}
                          </div>
                          {h.latitude != null && h.longitude != null && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              📍 <a href={`https://www.google.com/maps?q=${h.latitude},${h.longitude}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                                {h.latitude.toFixed(5)}, {h.longitude.toFixed(5)}
                              </a>
                              {h.locationAccuracy != null && ` (±${Math.round(h.locationAccuracy)}m)`}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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
              {pendingPhotoPreview && (
                <div style={{
                  marginTop: 10, padding: '0.6rem 0.75rem', borderRadius: 8, fontSize: '0.8rem',
                  background: gpsStatus === 'ok' ? '#ecfdf5' : gpsStatus === 'pending' ? '#eff6ff' : '#fef3c7',
                  color: gpsStatus === 'ok' ? '#065f46' : gpsStatus === 'pending' ? '#1e40af' : '#92400e',
                  border: `1px solid ${gpsStatus === 'ok' ? '#a7f3d0' : gpsStatus === 'pending' ? '#bfdbfe' : '#fcd34d'}`,
                }}>
                  {gpsStatus === 'pending' && '📍 위치 확인 중...'}
                  {gpsStatus === 'ok' && pendingGPS && (
                    <>
                      {gpsSource === 'exif' ? '📸 촬영 위치 기록됨' : '📍 업로드 위치 기록됨'}
                      {' '}({pendingGPS.latitude.toFixed(5)}, {pendingGPS.longitude.toFixed(5)}
                      {pendingGPS.accuracy != null && ` / ±${Math.round(pendingGPS.accuracy)}m`})
                    </>
                  )}
                  {gpsStatus === 'denied' && '⚠️ 위치 권한 거부됨 — 사진 EXIF에도 GPS가 없어 좌표가 기록되지 않습니다.'}
                  {gpsStatus === 'unsupported' && '⚠️ 이 기기는 위치 기능을 지원하지 않습니다.'}
                  {gpsStatus === 'error' && '⚠️ 위치 정보를 가져오지 못했습니다.'}
                  {gpsStatus === 'idle' && '위치 정보 확인 중...'}
                </div>
              )}
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
                  {/* 선로 관리 */}
                  <div style={{ background: '#eff6ff', borderRadius: 10, padding: '1rem', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-main)' }}>
                      선로 관리 ({lineConfigsDraft.length}개)
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.6rem' }}>
                      {lineConfigsDraft.map(l => (
                        <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button onClick={() => setSettingsLineId(l.id)}
                            style={{
                              padding: '0.35rem 0.75rem',
                              border: `1px solid ${settingsLineId === l.id ? 'var(--primary)' : 'var(--border-color)'}`,
                              borderRadius: 999,
                              background: settingsLineId === l.id ? 'var(--primary)' : 'white',
                              color: settingsLineId === l.id ? 'white' : 'var(--text-main)',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}>
                            {l.name}
                          </button>
                        </div>
                      ))}
                    </div>
                    {activeSettingsLine && (
                      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, minWidth: 56 }}>현재 선로명</label>
                        <input type="text" value={activeSettingsLine.name}
                          onChange={e => {
                            const v = e.target.value;
                            setLineConfigsDraft(prev => prev.map(l => l.id === settingsLineId ? { ...l, name: v } : l));
                          }}
                          style={{ flex: 1, padding: '0.4rem 0.55rem', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.85rem', fontFamily: 'var(--font-sans)' }} />
                        <button
                          onClick={() => {
                            if (lineConfigsDraft.length <= 1) {
                              setSettingsError('선로는 최소 1개 이상 필요합니다.');
                              return;
                            }
                            // 업로드된 데이터가 있는 선로는 삭제 금지
                            const hasData = towers.some(t => t.lineId === settingsLineId && (t.points.some(p => p.history.length > 0) || t.points.some(p => p.status === 'exempt')));
                            if (hasData) {
                              setSettingsError(`삭제 불가: "${activeSettingsLine.name}"에 업로드된 데이터가 있습니다.`);
                              return;
                            }
                            if (!confirm(`"${activeSettingsLine.name}" 선로를 삭제하시겠습니까?`)) return;
                            setSettingsError('');
                            const remaining = lineConfigsDraft.filter(l => l.id !== settingsLineId);
                            setLineConfigsDraft(remaining);
                            setSettingsLineId(remaining[0].id);
                          }}
                          style={{ padding: '0.4rem 0.6rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                          선로 삭제
                        </button>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <input type="text" placeholder="새 선로명 (예: 이천-광주 T/L)" value={newLineName}
                        onChange={e => setNewLineName(e.target.value)}
                        style={{ flex: 1, padding: '0.4rem 0.55rem', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.85rem', fontFamily: 'var(--font-sans)' }} />
                      <button
                        onClick={() => {
                          const name = newLineName.trim();
                          if (!name) { setSettingsError('선로명을 입력하세요.'); return; }
                          if (lineConfigsDraft.some(l => l.name === name)) { setSettingsError('중복 선로명입니다.'); return; }
                          setSettingsError('');
                          const newLine: LineConfig = { id: genLineId(), name, towers: [] };
                          setLineConfigsDraft(prev => [...prev, newLine]);
                          setSettingsLineId(newLine.id);
                          setNewLineName('');
                        }}
                        style={{ padding: '0.4rem 0.9rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                        선로 추가
                      </button>
                    </div>
                  </div>

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
                        const tower = towers.find(t => t.id === `${settingsLineId}-tower-${idx}`);
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
      {/* Undo Toast */}
      <div id="toast" className={`toast ${toastMsg ? 'show' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <span>{toastMsg}</span>
        {pendingUndo && (
          <button onClick={handleUndo} style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '0.2rem 0.6rem', borderRadius: 6, fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>실행취소</button>
        )}
      </div>

      {/* Navigation Modal */}
      {navTowerId && (() => {
        const t = towers.find(x => x.id === navTowerId);
        if (!t) return null;
        return (
          <div className="modal-overlay active" onClick={() => setNavTowerId(null)}>
            <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center' }}>🚗 {t.name} 길안내</h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <button onClick={() => {
                  const url = `tmap://route?goalname=${encodeURIComponent(t.name)}&goallat=${t.lat}&goallng=${t.lng}`;
                  window.location.href = url;
                }} style={{ padding: '1rem', background: '#ff7000', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem' }}>티맵(TMAP) 실행</button>
                <button onClick={() => {
                  const url = `kakaomap://route?ep=${t.lat},${t.lng}&by=CAR`;
                  window.location.href = url;
                }} style={{ padding: '1rem', background: '#fee500', color: '#3c1e1e', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem' }}>카카오내비 실행</button>
                <button onClick={() => {
                  const url = `nmap://route/car?dlat=${t.lat}&dlng=${t.lng}&dname=${encodeURIComponent(t.name)}`;
                  window.location.href = url;
                }} style={{ padding: '1rem', background: '#03c75a', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem' }}>네이버지도 실행</button>
              </div>
              <button className="btn-cancel" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setNavTowerId(null)}>닫기</button>
            </div>
          </div>
        );
      })()}

      <style jsx>{`
        @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>
    </>
  );
}
