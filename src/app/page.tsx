'use client';

import { useState, useEffect } from 'react';

type HistoryItem = {
  status: string;
  timestamp: number;
  photo: string;
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

export default function GroundCheckApp() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'towers'>('dashboard');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [currentCircuit, setCurrentCircuit] = useState(1);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'install' | 'remove'>('install');
  const [pendingPhotoData, setPendingPhotoData] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<{ towerId: string; pointId: string } | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  // Initial load
  useEffect(() => {
    let savedData = null;
    try {
      savedData = localStorage.getItem('groundcheck_data_v2');
    } catch (e) {}

    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (parsed && parsed.length === 26) {
        setTowers(parsed);
        return;
      }
    }
    
    // Generate Initial Data
    const names = ['이천S/S'];
    for (let i = 1; i <= 25; i++) names.push(`${i}호`);
    
    const initialTowers = names.map((name, i) => {
      const points: Point[] = [];
      [1, 2].forEach(circuit => {
        ['main', 'sub'].forEach(type => {
          points.push({
            id: `t${i}-c${circuit}-${type}`,
            name: type === 'main' ? '주접지' : '보조접지',
            circuit: circuit,
            type: type as 'main' | 'sub',
            status: 'none',
            history: []
          });
        });
      });
      return { id: `tower-${i}`, number: name, name: name, points };
    });
    setTowers(initialTowers);
  }, []);

  // Save changes
  useEffect(() => {
    if (towers.length > 0) {
      localStorage.setItem('groundcheck_data_v2', JSON.stringify(towers));
    }
  }, [towers]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const setCircuit = (c: number) => setCurrentCircuit(c);

  // Stats calculation
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

  // Render Dashboard
  const renderDashboard = () => (
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

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 className="section-title" style={{ marginTop: 0, borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
          접지 현황 (<span>{currentCircuit}회선</span>)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: 12, border: '1px solid var(--card-border)' }}>
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>총 대상개소 <small>(비대상 제외)</small></span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>{totalPoints}</span>
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
    </div>
  );

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

  const renderTowersView = () => {
    const filteredTowers = towers.filter(tower => {
      // Basic search ignored for now to be simple
      if (currentFilter !== 'all') {
        const overall = getTowerOverallStatus(tower);
        if (currentFilter === 'none' && overall !== 'none') return false;
        if (currentFilter === 'grounding' && overall !== 'grounding') return false;
        if (currentFilter === 'removed' && overall !== 'removed') return false;
        if (currentFilter === 'exempt' && (overall !== 'exempt' && overall !== 'partial_exempt')) return false;
      }
      return true;
    });

    return (
      <div className="towers-container">
        <div className="towers-toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="철탑번호 검색..." />
          </div>
          <div className="filter-group">
            {['all', 'none', 'grounding', 'removed', 'exempt'].map(f => (
              <button 
                key={f}
                className={`filter-btn ${currentFilter === f ? 'active' : ''}`}
                onClick={() => setCurrentFilter(f)}>
                {f === 'all' ? '전체' : f === 'none' ? '미등록' : f === 'grounding' ? '접지중' : f === 'removed' ? '작업완료' : '비대상포함'}
              </button>
            ))}
          </div>
        </div>
        <div className="tower-list">
          {filteredTowers.map(tower => {
            const points = tower.points.filter(p => p.circuit === currentCircuit);
            let noneC = 0, groundC = 0, rmvC = 0, exemptC = 0;
            points.forEach(p => {
              if(p.status === 'none') noneC++;
              else if(p.status === 'grounding') groundC++;
              else if(p.status === 'removed') rmvC++;
              else if(p.status === 'exempt') exemptC++;
            });

            return (
              <div key={tower.id} className="tower-item glass-card" onClick={() => setSelectedTowerId(tower.id)}>
                <div className="tower-info-basic">
                  <div className="tower-number" style={tower.number.length > 3 ? {fontSize: '1.1rem', width: 80} : {}}>{tower.name}</div>
                  <div>
                    <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem'}}>
                      미등록:{noneC} &nbsp;
                      <span style={{color: 'var(--status-grounding)'}}>접지설치:{groundC}</span> &nbsp;
                      <span style={{color: 'var(--status-removed)'}}>접지철거:{rmvC}</span>
                      {exemptC > 0 && <span style={{color: 'var(--status-exempt)'}}> 단독비대상:{exemptC}</span>}
                    </div>
                  </div>
                </div>
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
    );
  };

  // Upload Logic
  const handleCompress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const MAX_DIM = 800;
        let { width, height } = img;
        if (width > height) { if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; } }
        else { if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; } }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setPendingPhotoData(dataUrl);
      };
    };
  };

  const doUpload = () => {
    if (!selectedTowerId || !selectedPointId || !pendingPhotoData) return;
    setTowers(prev => prev.map(t => {
      if (t.id === selectedTowerId) {
        return {
          ...t,
          points: t.points.map(p => {
            if (p.id === selectedPointId) {
              const newStatus = uploadType === 'install' ? 'grounding' : 'removed';
              return {
                ...p,
                status: newStatus,
                history: [...p.history, { status: newStatus, timestamp: Date.now(), photo: pendingPhotoData }]
              };
            }
            return p;
          })
        };
      }
      return t;
    }));
    setPendingPhotoData(null);
    setSelectedPointId(null);
    showToast(`${uploadType === 'install' ? '접지설치' : '작업완료(철거)'} 처리가 완료되었습니다.`);
  };

  const togglePointExempt = (tId: string, pId: string) => {
    setTowers(prev => prev.map(t => {
      if (t.id === tId) {
        return {
          ...t,
          points: t.points.map(p => {
            if (p.id === pId) {
              if (p.status === 'exempt') return { ...p, status: 'none' };
              if (p.history.length > 0 && !confirm("모든 기록이 삭제됩니다. 계속하시겠습니까?")) return p;
              return { ...p, status: 'exempt', history: [] };
            }
            return p;
          })
        };
      }
      return t;
    }));
  };

  const deleteCurrentPhoto = () => {
    if (!viewingPhoto) return;
    if (!confirm("해당 사진 및 처리 기록을 삭제하시겠습니까?")) return;

    setTowers(prev => prev.map(t => {
      if (t.id === viewingPhoto.towerId) {
        return {
          ...t,
          points: t.points.map(p => {
            if (p.id === viewingPhoto.pointId) {
              const newHistory = [...p.history];
              newHistory.pop();
              const newStatus = newHistory.length > 0 ? newHistory[newHistory.length - 1].status as any : 'none';
              return { ...p, status: newStatus, history: newHistory };
            }
            return p;
          })
        };
      }
      return t;
    }));
    setViewingPhoto(null);
    showToast('기록이 삭제되었습니다.');
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
            <div className="circuit-toggle">
              <button className={`circuit-btn ${currentCircuit === 1 ? 'active' : ''}`} onClick={() => setCircuit(1)}>1회선</button>
              <button className={`circuit-btn ${currentCircuit === 2 ? 'active' : ''}`} onClick={() => setCircuit(2)}>2회선</button>
            </div>
          </div>
        </div>
      </header>

      {currentView === 'dashboard' ? (
        <section className="view active">{renderDashboard()}</section>
      ) : (
        <section className="view active">{renderTowersView()}</section>
      )}

      <nav className="bottom-nav">
        <button className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
          <span className="btn-icon">📊</span>
          <span className="btn-label">대시보드</span>
        </button>
        <button className={`nav-btn ${currentView === 'towers' ? 'active' : ''}`} onClick={() => setCurrentView('towers')}>
          <span className="btn-icon">🗼</span>
          <span className="btn-label">철탑목록</span>
        </button>
      </nav>

      {/* Modals */}
      {selectedTower && !selectedPointId && !viewingPhoto && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setSelectedTowerId(null)}>
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h2>{selectedTower.name} ({currentCircuit}회선)</h2>
              <button className="modal-close" onClick={() => setSelectedTowerId(null)}>✕</button>
            </div>
            <div className="modal-body">
              {selectedTower.points.filter(p => p.circuit === currentCircuit).map(pt => {
                const lastH = pt.history[pt.history.length - 1];
                const d = lastH ? new Date(lastH.timestamp).toLocaleString() : '-';
                return (
                  <div key={pt.id} className="point-section">
                    <div className="point-header">
                      <span className="point-title">{pt.name}</span>
                      <span className={`status-badge ${pt.status}`}>{pt.status === 'grounding' ? '접지설치됨' : pt.status === 'removed' ? '작업완료' : pt.status === 'exempt' ? '비대상' : '미등록'}</span>
                    </div>
                    <div className="point-details">
                      <div className="detail-row">
                        <span className="detail-label">최종 처리일시</span>
                        <span>{d}</span>
                      </div>
                      <div className="detail-row" style={{ marginTop: '0.5rem' }}>
                        {pt.status === 'exempt' ? (
                          <>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>통계 제외</span>
                            <button className="photo-btn" onClick={() => togglePointExempt(selectedTower.id, pt.id)} style={{ background: 'rgba(0,0,0,0.05)' }}>✔️ 비대상 해제</button>
                          </>
                        ) : (
                          <>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {lastH && <button className="photo-btn" onClick={() => setViewingPhoto({ towerId: selectedTower.id, pointId: pt.id })}>사진 보기</button>}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {pt.status === 'none' && <button className="photo-btn" onClick={() => togglePointExempt(selectedTower.id, pt.id)} style={{ background: 'rgba(239,68,68,0.1)', borderColor: '#ef4444', color: '#ef4444' }}>🚫 비대상</button>}
                              {['none', 'grounding'].includes(pt.status) && (
                                <button className="photo-btn primary" onClick={() => { setUploadType('install'); setSelectedPointId(pt.id); }}>📸 설치사진</button>
                              )}
                              {['grounding', 'removed'].includes(pt.status) && (
                                <button className="photo-btn" onClick={() => { setUploadType('remove'); setSelectedPointId(pt.id); }} style={{ background: 'rgba(16,185,129,0.2)', borderColor: '#10b981', color: '#10b981' }}>
                                  {pt.status === 'removed' ? '🔧 수정' : '🔧 철거사진'}
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedPointId && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setSelectedPointId(null)}>
          <div className="modal-content upload-modal-content glass-card">
            <div className="modal-header">
              <h2>사진 업로드</h2>
              <button className="modal-close" onClick={() => { setSelectedPointId(null); setPendingPhotoData(null); }}>✕</button>
            </div>
            <div className="upload-body">
              <div className="upload-type-selector">
                <button className={`upload-type-btn ${uploadType === 'install' ? 'active' : ''}`} id="btn-install" onClick={() => setUploadType('install')}><span className="type-icon">📸</span> <span>설치사진</span></button>
                <button className={`upload-type-btn ${uploadType === 'remove' ? 'active' : ''}`} id="btn-remove" onClick={() => setUploadType('remove')}><span className="type-icon">🔧</span> <span>철거사진</span></button>
              </div>
              <div className="upload-zone" onClick={() => document.getElementById('f-in')?.click()}>
                {!pendingPhotoData ? (
                  <div className="upload-placeholder"><span className="upload-icon">📷</span><p>사진 선택 (자동압축)</p></div>
                ) : (
                  <img src={pendingPhotoData} alt="미리보기" id="preview-img" style={{ maxHeight: 200 }} />
                )}
                <input id="f-in" type="file" accept="image/*" onChange={handleCompress} style={{ display: 'none' }} />
              </div>
              <div className="upload-actions">
                <button className="btn-cancel" onClick={() => { setSelectedPointId(null); setPendingPhotoData(null); }}>취소</button>
                <button className="btn-upload" onClick={doUpload} disabled={!pendingPhotoData}>업로드</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingPhoto && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setViewingPhoto(null)}>
          <div className="photo-modal-content glass-card" style={{ maxWidth: 600, width: '100%', margin: 'auto' }}>
            <div className="modal-header">
              <h2>기록 보기</h2>
              <button className="modal-close" onClick={() => setViewingPhoto(null)}>✕</button>
            </div>
            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <img src={towers.find(t => t.id === viewingPhoto.towerId)?.points.find(p => p.id === viewingPhoto.pointId)?.history.slice(-1)[0].photo} style={{ maxWidth: '100%', borderRadius: 8 }} />
              <button className="photo-btn danger" onClick={deleteCurrentPhoto} style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '1rem' }}>🗑️ 현재 사진 및 기록 삭제</button>
            </div>
          </div>
        </div>
      )}

      <div id="toast" className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </>
  );
}
