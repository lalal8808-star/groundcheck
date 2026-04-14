'use client';

import { useState, useEffect } from 'react';
import { registerUser, uploadGrounding, getLatestGrounding, uploadRegistry, getRegistries, deleteRegistry, deleteGroundingLog, togglePointExempt, getRegistryData } from './actions';

type User = {
  id: string;
  name: string;
  affiliation: string;
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

export default function GroundCheckApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'towers'>('dashboard');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [currentCircuit, setCurrentCircuit] = useState(1);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [registries, setRegistries] = useState<Registry[]>([]);
  
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'install' | 'remove'>('install');
  
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(null);

  const [viewingPhoto, setViewingPhoto] = useState<{ towerId: string; pointId: string } | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', affiliation: '' });

  useEffect(() => {
    const savedUser = localStorage.getItem('groundcheck_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    } else {
      setShowAuthModal(true);
    }
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      const logs = await getLatestGrounding(Date.now());
      const regs = await getRegistries(Date.now());
      setRegistries(regs as any || []);

      const names = ['이천S/S'];
      for (let i = 1; i <= 25; i++) names.push(`${i}호`);
      
      const initialTowers = names.map((name, i) => {
        const points: Point[] = [];
        [1, 2].forEach(circuit => {
          ['main', 'sub'].forEach(type => {
            const ptId = `t${i}-c${circuit}-${type}`;
            const ptLogs = logs.filter((l: any) => l.tower_id === `tower-${i}` && l.point_id === ptId);
            const latest = ptLogs[0];
            
            points.push({
              id: ptId,
              name: type === 'main' ? '주접지' : '보조접지',
              circuit: circuit,
              type: type as 'main' | 'sub',
              status: latest ? latest.status : 'none',
              history: ptLogs.map((l: any) => ({
                status: l.status,
                timestamp: new Date(l.created_at).getTime(),
                photo: l.photo_data,
                userName: l.user_name,
                affiliation: l.affiliation
              }))
            });
          });
        });
        return { id: `tower-${i}`, number: name, name: name, points };
      });
      setTowers(initialTowers);
    } catch (e: any) {
      console.error("Failed to fetch data", e);
    }
  };

  const handleAuthSubmit = async () => {
    if (!authForm.name || !authForm.affiliation) return;
    try {
      const user = await registerUser(authForm.name, authForm.affiliation);
      setCurrentUser(user as any);
      localStorage.setItem('groundcheck_user', JSON.stringify(user));
      setShowAuthModal(false);
      showToast(`${user.name} 님, 환영합니다.`);
    } catch (e: any) {
      alert("회원등록 실패: " + e.message);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  let totalPoints = 0;
  let stats = { none: 0, grounding: 0, removed: 0, exempt: 0 };
  
  towers.forEach(tower => {
    tower.points.forEach(pt => {
      if (pt.circuit === currentCircuit) {
        if (pt.status in stats) {
          stats[pt.status as keyof typeof stats]++;
        }
        if (pt.status !== 'exempt') totalPoints++;
      }
    });
  });

  const progressPct = totalPoints ? Math.round((stats.removed / totalPoints) * 100) : 0;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const MAX_DIM = 1000;
        let { width, height } = img;
        if (width > height) { if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; } }
        else { if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; } }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0,0,width,height);
          ctx.drawImage(img, 0, 0, width, height);
        }
        
        setPendingPhotoPreview(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  };

  const handlePhotoUpload = async () => {
    if (!currentUser) return setShowAuthModal(true);
    if (!selectedTowerId || !selectedPointId || !pendingPhotoPreview) return;

    setIsLoading(true);
    setUploadMessage('파일 전송 중...');
    try {
      const resp = await uploadGrounding({
        towerId: selectedTowerId,
        pointId: selectedPointId,
        status: uploadType === 'install' ? 'grounding' : 'removed',
        photoData: pendingPhotoPreview,
        userId: currentUser.id
      });
      if (resp.success) {
        setPendingPhotoPreview(null);
        setSelectedPointId(null);
        await refreshData();
        showToast('업로드가 완료되었습니다.');
      } else {
        alert("업로드 기록 실패: " + resp.error);
      }
    } catch (e: any) {
      alert("파일 전송 실패: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return setShowAuthModal(true);
    const file = e.target.files?.[0];
    if (!file) return;

    const title = prompt("접지관리대장 제목을 입력하세요");
    if (!title) {
       if (e.target) e.target.value = '';
       return;
    }

    setIsLoading(true);
    setUploadMessage('파일 전송 중...');
    
    const reader = new FileReader();
    reader.onload = async (event) => {
       const fileData = event.target?.result as string;
       if (fileData.length > 4500000) {
          alert("파일 용량이 너무 큽니다. (약 3MB 한도 초과)");
          setIsLoading(false);
          if (e.target) e.target.value = '';
          return;
       }
       
       try {
         const resp = await uploadRegistry(title, fileData, currentUser.id);
         if (resp.success) {
            await refreshData();
            showToast('대장이 성공적으로 등록되었습니다.');
         } else {
            alert("대장 기록 실패: " + resp.error);
         }
       } catch (err: any) {
         alert("대장 파일 업로드 에러: " + err.message);
       } finally {
         setIsLoading(false);
         if (e.target) e.target.value = '';
       }
    };
    reader.readAsDataURL(file);
  };

  const toggleExempt = async (tId: string, pId: string, currentStatus: string) => {
    if (!currentUser) return setShowAuthModal(true);
    if (currentStatus !== 'exempt' && !confirm("비대상으로 전환하시겠습니까? (기록은 유지되지만 통계에서 제외됩니다)")) return;
    
    setIsLoading(true);
    try {
      const resp = await togglePointExempt(tId, pId, currentUser.id, currentStatus !== 'exempt');
      if (resp.success) {
        await refreshData();
      } else {
        alert("실패: " + resp.error);
      }
    } catch (e: any) {
      alert("전환 에러: " + e.message);
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
            <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap: '0.25rem'}}>
              {currentUser && <span style={{fontSize:'0.7rem', color:'var(--primary)'}}>{currentUser.affiliation} {currentUser.name} 님</span>}
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
          <svg style={{width:'1.5rem', height:'1.5rem', marginRight:'0.5rem'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          <span className="btn-label">대시보드</span>
        </button>
        <button className={`nav-btn ${currentView === 'towers' ? 'active' : ''}`} style={{ fontSize: '1.2rem', padding: '1rem 2rem' }} onClick={() => setCurrentView('towers')}>
          <svg style={{width:'1.5rem', height:'1.5rem', marginRight:'0.5rem'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          <span className="btn-label">철탑목록</span>
        </button>
      </nav>

      {currentView === 'dashboard' ? (
        <section className="view active">
          <div className="dashboard-container">
            {/* 사업 현황 */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.25rem', background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <svg style={{width:'1.25rem', height:'1.25rem', color:'var(--primary)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>공사 개요</h2>
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>사업명</span>
                  <span style={{ fontWeight: 600 }}>154kV 이천-가남 등 2개T/L 용량증대 선종교체공사</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>선로명</span>
                    <span style={{ fontWeight: 600 }}>154kV 이천-가남 T/L</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>총 철탑수</span>
                    <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{towers.length}기</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 접지 현황 */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
              <h3 className="section-title">접지 현황 ({currentCircuit}회선)</h3>
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
                     <span>전체 진척도</span>
                     <span>{progressPct}%</span>
                   </div>
                   <div className="progress-track"><div className="progress-fill secondary" style={{ width: `${progressPct}%` }}></div></div>
                </div>
              </div>
            </div>

            {/* 접지관리대장 */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg style={{width:'1.25rem', height:'1.25rem', color:'var(--primary)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    접지관리대장
                  </h3>
                  <button className="photo-btn primary" onClick={() => document.getElementById('reg-in')?.click()} disabled={isLoading}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{width:'1rem', height:'1rem'}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    파일 업로드
                  </button>
                  <input id="reg-in" type="file" onClick={(e) => { (e.target as any).value = '' }} onChange={handleRegistryUpload} style={{ display: 'none' }} />
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {registries.map(reg => (
                    <div key={reg.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{reg.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{reg.user_name} | {new Date(reg.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{display:'flex', gap:'0.5rem'}}>
                        <button className="photo-btn" onClick={async () => {
                          try {
                            setIsLoading(true);
                            const dataUrl = await getRegistryData(reg.id);
                            if (!dataUrl) {
                               alert("데이터가 없습니다.");
                               return;
                            }
                            
                            const response = await fetch(dataUrl);
                            const blob = await response.blob();
                            const blobUrl = URL.createObjectURL(blob);
                            
                            const newTab = window.open(blobUrl, '_blank');
                            if (!newTab) {
                               const link = document.createElement('a');
                               link.href = blobUrl;
                               link.download = reg.title;
                               document.body.appendChild(link);
                               link.click();
                               document.body.removeChild(link);
                            }
                            
                            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
                          } catch (e: any) {
                            alert("열기 실패: " + e.message);
                          } finally {
                            setIsLoading(false);
                          }
                        }} style={{fontSize:'0.75rem'}}>열기</button>
                        <button className="photo-btn danger" onClick={async () => { if(confirm('삭제하시겠습니까?')) { try{ await deleteRegistry(reg.id); refreshData(); } catch(e:any) { alert("오류: "+e.message) } } }} style={{padding:'4px 8px'}}>🗑️</button>
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
                 )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal-overlay active"><div className="modal-content glass-card" style={{ maxWidth: 400, margin: 'auto' }}>
          <div className="modal-header"><h2>사용자 등록</h2></div>
          <div className="modal-body">
            <input type="text" placeholder="소속" className="search-box" value={authForm.affiliation} onChange={e => setAuthForm({...authForm, affiliation: e.target.value})} style={{ padding: 12, marginBottom: 10, border: '1px solid #ddd', borderRadius: 8, width: '100%' }} />
            <input type="text" placeholder="이름" className="search-box" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} style={{ padding: 12, marginBottom: 20, border: '1px solid #ddd', borderRadius: 8, width: '100%' }} />
            <button className="btn-upload" style={{ width: '100%' }} onClick={handleAuthSubmit}>로그인</button>
          </div>
        </div></div>
      )}

      {/* Detail Modal */}
      {selectedTower && (
        <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && setSelectedTowerId(null)}>
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h2>{selectedTower.name} 상세 ({currentCircuit}회선)</h2>
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
                       <button className="photo-btn primary" onClick={() => { setSelectedPointId(pt.id); setUploadType('install'); }}>📸 설치</button>
                       {pt.status === 'grounding' && <button className="photo-btn" style={{ borderColor: '#10b981', color: '#10b981' }} onClick={() => { setSelectedPointId(pt.id); setUploadType('remove'); }}>🔧 철거</button>}
                       <button className="photo-btn" onClick={() => toggleExempt(selectedTower.id, pt.id, pt.status)} style={{ background: pt.status === 'exempt' ? '#ef4444' : '#f1f5f9', color: pt.status === 'exempt' ? 'white' : 'inherit' }}>
                         {pt.status === 'exempt' ? '✅ 비대상 해제' : '🚫 비대상 체크'}
                       </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {selectedPointId && (
        <div className="modal-overlay active">
          <div className="modal-content glass-card" style={{ maxWidth: 400, margin: 'auto' }}>
             <div className="modal-header"><h2>사진 업로드</h2></div>
             <div className="upload-body">
                <input type="file" accept="image/*" onClick={(e) => { (e.target as any).value = '' }} onChange={handleFileSelect} disabled={isLoading} />
                {pendingPhotoPreview && <img src={pendingPhotoPreview} style={{ maxWidth: '100%', marginTop: 10 }} />}
                <div className="upload-actions" style={{ marginTop: 20 }}>
                   <button className="btn-cancel" onClick={() => { setSelectedPointId(null); setPendingPhotoPreview(null); }} disabled={isLoading}>취소</button>
                   <button className="btn-upload" onClick={handlePhotoUpload} disabled={!pendingPhotoPreview || isLoading}>
                     {isLoading ? "업로드 중..." : "업로드"}
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Loading Bar / Toast */}
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
