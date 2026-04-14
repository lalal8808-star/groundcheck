'use client';

import { useState, useEffect } from 'react';
import { registerUser, uploadGrounding, getLatestGrounding, uploadRegistry, getRegistries, deleteRegistry, deleteGroundingLog } from './actions';

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
  const [pendingPhotoData, setPendingPhotoData] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<{ towerId: string; pointId: string } | null>(null);
  const [toastMsg, setToastMsg] = useState('');

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
      const logs = await getLatestGrounding();
      const regs = await getRegistries();
      setRegistries(regs as any);

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
      if (!towers.length) {
         // Create local dummy while db uninitialized
         const names = ['이천S/S'];
         for (let i = 1; i <= 25; i++) names.push(`${i}호`);
         const dummy = names.map((n, i) => ({ id: `tower-${i}`, number: n, name: n, points: [] }));
         setTowers(dummy);
      }
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
      alert("회원가입 오류: /api/init-db 설치가 완료되었는지 확인해 주세요. " + e.message);
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
        stats[pt.status]++;
        if (pt.status !== 'exempt') totalPoints++;
      }
    });
  });

  const progressPct = totalPoints ? Math.round((stats.removed / totalPoints) * 100) : 0;

  const handleCompress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show loading state implicitly by disabling UI or processing
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const MAX_DIM = 800; // compress image dimension to prevent large payloads
        let { width, height } = img;
        if (width > height) { if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; } }
        else { if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; } }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.fillStyle = 'white';
        ctx?.fillRect(0,0,width,height);
        ctx?.drawImage(img, 0, 0, width, height);
        // high compression ratio
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setPendingPhotoData(dataUrl);
      };
    };
  };

  const handlePhotoUpload = async () => {
    if (!currentUser) return setShowAuthModal(true);
    if (!selectedTowerId || !selectedPointId || !pendingPhotoData) return;

    try {
      await uploadGrounding({
        towerId: selectedTowerId,
        pointId: selectedPointId,
        status: uploadType === 'install' ? 'grounding' : 'removed',
        photoData: pendingPhotoData,
        userId: currentUser.id
      });
      setPendingPhotoData(null);
      setSelectedPointId(null);
      refreshData();
      showToast('업로드가 완료되었습니다.');
    } catch (e: any) {
      alert("업로드 실패 (DB 연동 또는 용량 오류): " + e.message);
      console.error(e);
    }
  };

  const handleRegistryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return setShowAuthModal(true);
    const file = e.target.files?.[0];
    if (!file) return;

    const title = prompt("접지관리대장 제목을 입력하세요 (예: 1회선 준공계)");
    if (!title) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        await uploadRegistry(title, event.target?.result as string, currentUser.id);
        refreshData();
        showToast('접지관리대장이 업로드되었습니다.');
      } catch (e: any) {
        alert("업로드 실패 (DB 연동 오류): " + e.message);
      }
    };
    reader.readAsDataURL(file);
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
    if (exemptCnt > 0) return 'partial_exempt';
    return 'none';
  };

  const selectedTower = towers.find(t => t.id === selectedTowerId);

  return (
    <>
      <header id="app-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-icon">⚡</div>
            <div className="header-text">
              <h1 id="main-title">접지관리 시스템</h1>
              <p className="project-name" style={{margin:0}}>154kV 이천-가남 등 2개T/L</p>
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

      {/* Nav positioned right below header now */}
      <nav className="top-nav">
        <button className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>📊 <span className="btn-label">대시보드</span></button>
        <button className={`nav-btn ${currentView === 'towers' ? 'active' : ''}`} onClick={() => setCurrentView('towers')}>🗼 <span className="btn-label">철탑목록</span></button>
      </nav>

      {currentView === 'dashboard' ? (
        <section className="view active">
          <div className="dashboard-container">
            {/* 사업 현황 Card */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.25rem', background: 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(241,245,249,0.8) 100%)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -50, right: -50, width: 100, height: 100, background: 'var(--primary)', opacity: 0.1, filter: 'blur(50px)', borderRadius: '50%' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 10, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <span style={{ fontSize: '1.1rem', color: '#3b82f6' }}>📍</span>
                </div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>공사 개요</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 500 }}>사업명</span>
                  <span style={{ display: 'inline-block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4 }}>154kV 이천-가남 등 2개T/L 용량증대 선종교체공사</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.85rem', borderRadius: 10, border: '1px solid var(--card-border)' }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', paddingBottom: '0.2rem' }}>선로명</span>
                    <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>154kV 이천-가남 T/L</span>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.85rem', borderRadius: 10, border: '1px solid var(--card-border)' }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', paddingBottom: '0.2rem' }}>총 철탑수</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                       <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{towers.length}</span>
                       <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>기</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 접지 현황 Card */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
              <h3 className="section-title" style={{ marginTop: 0, borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                접지 현황 ({currentCircuit}회선)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: 12, border: '1px solid var(--card-border)' }}>
                  <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>총 대상개소 <small>(비대상 제외)</small></span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalPoints}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.75rem 0.5rem', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid var(--card-border)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--status-none)', marginBottom: '0.25rem' }}>미등록</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--status-none)' }}>{stats.none}</span>
                  </div>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem 0.5rem', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--status-grounding)', marginBottom: '0.25rem' }}>접지개소(설치)</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--status-grounding)' }}>{stats.grounding}</span>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem 0.5rem', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--status-removed)', marginBottom: '0.25rem' }}>작업완료(철거)</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--status-removed)' }}>{stats.removed}</span>
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                     <span>전체 작업 진척도 (작업완료 기준)</span>
                     <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{progressPct}%</span>
                   </div>
                   <div className="progress-track" style={{ height: 12 }}>
                     <div className="progress-fill secondary" style={{ width: `${progressPct}%` }}></div>
                   </div>
                </div>
              </div>
            </div>

            {/* 접지관리대장 Card (Moved and renamed) */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                  <h3 style={{fontSize:'1.1rem', fontWeight:700}}>📂 접지관리대장</h3>
                  <button className="photo-btn primary" onClick={() => document.getElementById('reg-in')?.click()}>파일 업로드</button>
                  <input id="reg-in" type="file" onChange={handleRegistryUpload} style={{display:'none'}} />
               </div>
               <div style={{display:'flex', flexDirection:'column', gap: '0.75rem'}}>
                  {registries.length === 0 && <p style={{fontSize:'0.85rem', color:'var(--text-muted)', textAlign:'center', padding:'1rem'}}>등록된 대장이 없습니다.</p>}
                  {registries.map(reg => (
                    <div key={reg.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(0,0,0,0.02)', padding:'0.75rem', borderRadius:8, border:'1px solid var(--card-border)'}}>
                      <div style={{display:'flex', flexDirection:'column'}}>
                        <span style={{fontSize:'0.9rem', fontWeight:600}}>{reg.title}</span>
                        <span style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>{reg.user_name} | {new Date(reg.created_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{display:'flex', gap:'0.5rem'}}>
                        <button className="photo-btn" onClick={() => {
                          const link = document.createElement('a');
                          link.href = reg.file_data;
                          link.download = reg.title;
                          link.click();
                        }} style={{fontSize:'0.75rem'}}>다운로드</button>
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
          {/* Towers View List */}
          <div className="towers-container">
            <div className="towers-toolbar">
              <div className="filter-group">
                {['all', 'none', 'grounding', 'removed', 'exempt'].map(f => (
                  <button 
                    key={f}
                    className={`filter-btn ${currentFilter === f ? 'active' : ''}`}
                    onClick={() => setCurrentFilter(f)}>
                    {f === 'all' ? '전체' : f === 'none' ? '미등록' : f === 'grounding' ? '접지중' : f === 'removed' ? '작업완료' : '비대상'}
                  </button>
                ))}
              </div>
            </div>
            <div className="tower-list">
              {towers.filter(tower => {
                 if (currentFilter !== 'all') {
                    const overall = getTowerOverallStatus(tower);
                    if (currentFilter === 'none' && overall !== 'none') return false;
                    if (currentFilter === 'grounding' && overall !== 'grounding') return false;
                    if (currentFilter === 'removed' && overall !== 'removed') return false;
                    if (currentFilter === 'exempt' && (overall !== 'exempt' && overall !== 'partial_exempt')) return false;
                 }
                 return true;
              }).map(tower => {
                 const points = tower.points.filter(p => p.circuit === currentCircuit);
                 let nc = 0, gc = 0, rc = 0, ec = 0;
                 points.forEach(p => { if(p.status==='none')nc++; else if(p.status==='grounding')gc++; else if(p.status==='removed')rc++; else if(p.status==='exempt')ec++ });
                 return (
                  <div key={tower.id} className="tower-item glass-card" onClick={() => setSelectedTowerId(tower.id)}>
                     <div className="tower-info-basic">
                        <div className="tower-number">{tower.name}</div>
                        <div style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>
                          <span style={{color:'var(--status-none)'}}>미등록 {nc}</span> / <span style={{color:'var(--status-grounding)'}}>접지 {gc}</span> / <span style={{color:'var(--status-removed)'}}>철거 {rc}</span>
                        </div>
                     </div>
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
        <div className="modal-overlay active">
          <div className="modal-content glass-card" style={{maxWidth:400, margin:'auto'}}>
             <div className="modal-header"><h2>회원 정보 등록</h2></div>
             <div className="modal-body">
                <p style={{fontSize:'0.9rem', color:'var(--text-muted)'}}>사진 및 대장 업로드를 위해 소속과 이름을 입력해 주세요.</p>
                <div style={{display:'flex', flexDirection:'column', gap:'1rem', marginTop:'1rem'}}>
                  <input type="text" placeholder="소속 (예: 가남전력)" className="search-box" value={authForm.affiliation} onChange={e => setAuthForm({...authForm, affiliation: e.target.value})} style={{padding:12, border:'1px solid #ccc', borderRadius:'8px'}} />
                  <input type="text" placeholder="이름" className="search-box" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} style={{padding:12, border:'1px solid #ccc', borderRadius:'8px'}} />
                  <button className="btn-upload" onClick={handleAuthSubmit}>등록 및 로그인</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedTower && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setSelectedTowerId(null)}>
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h2>{selectedTower.name} 상세</h2>
              <button className="modal-close" onClick={() => setSelectedTowerId(null)}>✕</button>
            </div>
            <div className="modal-body">
              {selectedTower.points.filter(p => p.circuit === currentCircuit).map(pt => {
                const latest = pt.history[0];
                return (
                  <div key={pt.id} className="point-section">
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'0.5rem'}}>
                       <span style={{fontWeight:700, color:'var(--primary)'}}>{pt.name}</span>
                       <span className={`status-badge ${pt.status}`}>{pt.status}</span>
                    </div>
                    {latest && (
                      <div style={{fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'0.5rem'}}>
                        최근 업로드: {latest.affiliation} {latest.userName} ({new Date(latest.timestamp).toLocaleString()})
                      </div>
                    )}
                    <div style={{display:'flex', gap:'0.5rem'}}>
                       {latest && <button className="photo-btn" onClick={() => setViewingPhoto({towerId: selectedTower.id, pointId: pt.id})}>기록보기</button>}
                       <button className="photo-btn primary" onClick={() => { setSelectedPointId(pt.id); setUploadType('install'); }}>📸 설치</button>
                       {pt.status === 'grounding' && <button className="photo-btn" style={{borderColor:'#10b981', color:'#10b981'}} onClick={() => { setSelectedPointId(pt.id); setUploadType('remove'); }}>🔧 철거</button>}
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
          <div className="modal-content glass-card" style={{maxWidth:400, margin:'auto'}}>
             <div className="modal-header"><h2>사진 업로드</h2></div>
             <div className="upload-body">
                <input type="file" accept="image/*" onChange={handleCompress} />
                {pendingPhotoData && <img src={pendingPhotoData} style={{maxWidth:'100%', marginTop:10}} />}
                <div className="upload-actions" style={{marginTop:20}}>
                   <button className="btn-cancel" onClick={() => { setSelectedPointId(null); setPendingPhotoData(null); }}>취소</button>
                   <button className="btn-upload" onClick={handlePhotoUpload} disabled={!pendingPhotoData}>업로드</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Photo View / Deletion */}
      {viewingPhoto && (
        <div className="modal-overlay active" onClick={() => setViewingPhoto(null)}>
           <div className="modal-content glass-card" style={{maxWidth:600, margin:'auto', padding:20}}>
              <img src={towers.find(t => t.id === viewingPhoto.towerId)?.points.find(p => p.id === viewingPhoto.pointId)?.history[0]?.photo} style={{width:'100%'}} />
              <button className="photo-btn danger" style={{marginTop:10, width:'100%'}} onClick={async () => {
                if(confirm('기록을 삭제하시겠습니까?')) {
                  try {
                    await deleteGroundingLog(viewingPhoto.towerId, viewingPhoto.pointId);
                    setViewingPhoto(null);
                    refreshData();
                  } catch(e: any) { alert("삭제 실패: " + e.message) }
                }
              }}>🗑️ 기록 삭제</button>
           </div>
        </div>
      )}

      <div id="toast" className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </>
  );
}
