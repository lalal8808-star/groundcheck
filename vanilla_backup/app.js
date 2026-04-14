// App State
const state = {
  currentView: 'dashboard',
  currentFilter: 'all',
  currentCircuit: 1, // 1 or 2
  towers: [],
  selectedTowerId: null,
  selectedPointId: null,
  uploadType: 'install', // 'install' or 'remove'
  pendingPhotoData: null,
  viewingPhoto: null // { towerId, pointId }
};

// Tower sequence: 이천S/S, 1호 ~ 25호
const TOWER_NAMES = ['이천S/S'];
for (let i = 1; i <= 25; i++) {
  TOWER_NAMES.push(`${i}호`);
}

const CIRCUITS = [1, 2];
const POINT_TYPES = ['main', 'sub']; // main: 주접지, sub: 보조접지

// Initialize App
function init() {
  loadData();
  setCircuit(1); // will call renderDashboard and renderTowers
}

// Data Management
function loadData() {
  let savedData = null;
  try {
    savedData = localStorage.getItem('groundcheck_data_v2');
  } catch(e) {}
  
  if (savedData) {
    state.towers = JSON.parse(savedData);
    if (!state.towers || state.towers.length !== 26) {
      console.log('Regenerating tower data due to structure mismatch');
      generateData();
    }
  } else {
    // Try migrating from old key
    let oldData = localStorage.getItem('groundcheck_data');
    if (oldData) {
      try {
        let parsed = JSON.parse(oldData);
        if (parsed && parsed.length === 26 && typeof parsed[0].isExempt === 'undefined') {
           state.towers = parsed;
           saveData();
           return;
        }
      } catch(e) {}
    }
    generateData();
  }
}

function generateData() {
  state.towers = TOWER_NAMES.map((name, i) => {
    const points = [];
    
    CIRCUITS.forEach(circuit => {
      POINT_TYPES.forEach(type => {
        points.push({
          id: `t${i}-c${circuit}-${type}`,
          name: `${type === 'main' ? '주접지' : '보조접지'}`,
          circuit: circuit,
          type: type,
          status: 'none', // 'none', 'grounding', 'removed', 'exempt'
          history: [] // { status, timestamp, photo }
        });
      });
    });

    return {
      id: `tower-${i}`,
      number: name,
      name: name,
      points: points
    };
  });
  saveData();
}

function saveData() {
  try {
    localStorage.setItem('groundcheck_data_v2', JSON.stringify(state.towers));
  } catch (e) {
    console.error('Storage full or error', e);
    showToast('저장 공간이 부족하여 최신 변경사항이 저장되지 않을 수 있습니다.');
  }
}

// Navigation & Views
function showView(viewId) {
  state.currentView = viewId;
  
  // Update buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === `btn-${viewId}`);
  });
  
  // Update views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.toggle('active', view.id === `view-${viewId}`);
  });

  if (viewId === 'dashboard') {
    renderDashboard();
  } else if (viewId === 'towers') {
    renderTowers();
  }
}

function setCircuit(circuit) {
  state.currentCircuit = circuit;
  
  document.getElementById('btn-circuit-1').classList.toggle('active', circuit === 1);
  document.getElementById('btn-circuit-2').classList.toggle('active', circuit === 2);
  
  renderDashboard();
  renderTowers();
}

// Dashboard Rendering
function renderDashboard() {
  let totalPoints = 0;
  let stats = { none: 0, grounding: 0, removed: 0, exempt: 0 };
  
  state.towers.forEach(tower => {    
    tower.points.forEach(pt => {
      // ONLY compute for the selected circuit
      if (pt.circuit !== state.currentCircuit) return;

      if (stats[pt.status] !== undefined) {
        stats[pt.status]++;
      }
      
      // Calculate totals, excluding exempt points
      if (pt.status !== 'exempt') {
        totalPoints++;
      }
    });
  });

  document.getElementById('dashboard-circuit-label').textContent = `${state.currentCircuit}회선`;
  if (document.getElementById('dash-total-towers')) {
    document.getElementById('dash-total-towers').textContent = String(state.towers.length);
  }
  
  // Update numbers
  document.getElementById('stat-total').textContent = totalPoints;
  document.getElementById('stat-grounding').textContent = stats.grounding;
  document.getElementById('stat-removed').textContent = stats.removed;
  document.getElementById('stat-none').textContent = stats.none;

  // Single overarching progress bar based on "removed" (작업완료) vs "totalPoints"
  const pct = totalPoints ? Math.round((stats.removed / totalPoints) * 100) : 0;
  
  document.getElementById('stat-progress-pct').textContent = `${pct}%`;
  document.getElementById('bar-main-progress').style.width = `${pct}%`;
}

// Tower List Rendering
function setFilter(filter) {
  state.currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderTowers();
}

function filterTowers() {
  renderTowers();
}

function getCircuitPoints(tower) {
  return tower.points.filter(p => p.circuit === state.currentCircuit);
}

function getTowerOverallStatus(tower) {
  const points = getCircuitPoints(tower);
  const groundingCnt = points.filter(p => p.status === 'grounding').length;
  const removedCnt = points.filter(p => p.status === 'removed').length;
  const exemptCnt = points.filter(p => p.status === 'exempt').length;
  const total = points.length;
  
  if (exemptCnt === total && total > 0) return 'exempt';
  
  if (removedCnt + exemptCnt === total && removedCnt > 0) return 'removed';
  if (groundingCnt > 0 || removedCnt > 0) return 'grounding';
  if (exemptCnt > 0) return 'partial_exempt';
  
  return 'none';
}

function renderTowers() {
  const container = document.getElementById('tower-list');
  const query = document.getElementById('tower-search').value.toLowerCase();
  
  container.innerHTML = '';
  
  const filteredTowers = state.towers.filter(tower => {
    if (query && !tower.name.toLowerCase().includes(query)) return false;
    
    if (state.currentFilter !== 'all') {
      const overall = getTowerOverallStatus(tower);
      if (state.currentFilter === 'none' && overall !== 'none') return false;
      if (state.currentFilter === 'grounding' && overall !== 'grounding') return false;
      if (state.currentFilter === 'removed' && overall !== 'removed') return false;
      if (state.currentFilter === 'exempt' && (overall !== 'exempt' && overall !== 'partial_exempt')) return false;
    }
    
    return true;
  });

  filteredTowers.forEach(tower => {
    const el = document.createElement('div');
    el.className = `tower-item glass-card`;
    el.onclick = () => openTowerModal(tower.id);
    
    const points = getCircuitPoints(tower);
    let noneC = 0, groundC = 0, rmvC = 0, exemptC = 0;
    points.forEach(p => {
      if(p.status === 'none') noneC++;
      else if(p.status === 'grounding') groundC++;
      else if(p.status === 'removed') rmvC++;
      else if(p.status === 'exempt') exemptC++;
    });

    let displayClassStatus = `미등록:${noneC} <span style="color:var(--status-grounding)">접지설치:${groundC}</span> <span style="color:var(--status-removed)">접지철거:${rmvC}</span>`;
    if (exemptC > 0) {
      displayClassStatus += ` <span style="color:var(--status-exempt)">단독비대상:${exemptC}</span>`;
    }

    el.innerHTML = `
      <div class="tower-info-basic">
        <div class="tower-number" style="${tower.number.length > 3 ? 'font-size:1.1rem;width:80px;' : ''}">${tower.name}</div>
        <div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem">
            ${displayClassStatus}
          </div>
        </div>
      </div>
      <div class="status-dots">
        ${points.map(p => `
          <div class="status-circle ${p.status === 'grounding' ? 'grounding' : p.status === 'removed' ? 'removed' : p.status === 'exempt' ? 'exempt' : ''}" title="${p.name}"></div>
        `).join('')}
      </div>
    `;
    container.appendChild(el);
  });
}

// Modals
function openTowerModal(towerId) {
  state.selectedTowerId = towerId;
  const tower = state.towers.find(t => t.id === towerId);
  if (!tower) return;

  // Title indicates circuit
  document.getElementById('modal-tower-title').textContent = `${tower.name} (${state.currentCircuit}회선)`;

  const body = document.getElementById('modal-body');
  body.innerHTML = '';
  
  const points = getCircuitPoints(tower);
  const section = document.createElement('div');
  
  points.forEach(pt => {
    const ptEl = document.createElement('div');
    ptEl.className = 'point-section';
    
    const lastHistory = pt.history.length > 0 ? pt.history[pt.history.length - 1] : null;
    let statusBadgeCls = 'status-badge';
    let statusLabel = '미등록';
    
    if (pt.status === 'grounding') { statusBadgeCls += ' grounding'; statusLabel = '접지설치됨'; }
    if (pt.status === 'removed') { statusBadgeCls += ' removed'; statusLabel = '작업완료'; }
    if (pt.status === 'exempt') { statusBadgeCls += ' exempt'; statusLabel = '비대상'; }

    let latestDate = '-';
    if (lastHistory) {
       const d = new Date(lastHistory.timestamp);
       latestDate = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }

    ptEl.innerHTML = `
      <div class="point-header">
        <span class="point-title">${pt.name}</span>
        <span class="${statusBadgeCls}">${statusLabel}</span>
      </div>
      <div class="point-details">
        <div class="detail-row">
          <span class="detail-label">최종 처리일시</span>
          <span>${latestDate}</span>
        </div>
        <div class="detail-row" style="margin-top: 0.5rem">
          ${pt.status === 'exempt' ? `
            <span style="font-size:0.8rem; color:var(--text-muted);">통계 제외 및 업로드 제한</span>
            <button class="photo-btn" onclick="togglePointExempt('${towerId}', '${pt.id}')" style="background:rgba(255,255,255,0.05);">
              ✔️ 비대상 해제
            </button>
          ` : `
            <div style="display:flex; gap: 0.5rem;">
              ${pt.history.length > 0 ? `
                 <button class="photo-btn" onclick="viewPhoto('${towerId}', '${pt.id}')" style="background:rgba(255,255,255,0.1)">
                   <span>사진기록 보기</span>
                 </button>
               ` : '<span></span>'}
            </div>
            <div style="display:flex; gap:0.5rem">
              ${pt.status === 'none' ? `
              <button class="photo-btn" onclick="togglePointExempt('${towerId}', '${pt.id}')" style="background:rgba(239, 68, 68, 0.1); border-color:#ef4444; color:#f87171">
                🚫 비대상
              </button>
              ` : ''}
            
              ${pt.status !== 'removed' && pt.status !== 'exempt' ? `
              <button class="photo-btn primary" onclick="openUploadModal('${towerId}', '${pt.id}', 'install')">
                <span>📸 설치사진</span>
              </button>
              ` : ''}
              ${pt.status === 'grounding' ? `
              <button class="photo-btn" onclick="openUploadModal('${towerId}', '${pt.id}', 'remove')" style="background:rgba(16,185,129,0.2); border-color:#10b981; color:#34d399">
                <span>🔧 철거사진</span>
              </button>
              ` : ''}
              ${pt.status === 'removed' ? `
              <button class="photo-btn" onclick="openUploadModal('${towerId}', '${pt.id}', 'remove')" style="background:rgba(16,185,129,0.2); border-color:#10b981; color:#34d399">
                <span>🔧 수정</span>
              </button>
              ` : ''}
            </div>
          `}
        </div>
      </div>
    `;
    section.appendChild(ptEl);
  });
  body.appendChild(section);

  document.getElementById('tower-modal').classList.add('active');
}

// Point Utilities
function togglePointExempt(towerId, pointId) {
  const tower = state.towers.find(t => t.id === towerId);
  const pt = tower && tower.points.find(p => p.id === pointId);
  if (!pt) return;

  if (pt.status === 'exempt') {
    pt.status = 'none';
  } else {
    // We only allow setting exempt if there's no history otherwise it prompts error or wipes history
    if (pt.history.length > 0) {
      if (!confirm("등록된 사진 및 기록이 모두 삭제되며 비대상으로 설정됩니다. 계속하시겠습니까?")) return;
    }
    pt.status = 'exempt';
    pt.history = []; // wipe out history
  }
  
  saveData();
  renderDashboard();
  renderTowers();
  openTowerModal(towerId);
  
  showToast(pt.status === 'exempt' ? `${pt.name} - 비대상 설정됨` : `${pt.name} - 비대상 해제됨`);
}

function closeModal() {
  document.getElementById('tower-modal').classList.remove('active');
  state.selectedTowerId = null;
}

function closeModalOutside(e) {
  if(e.target === document.getElementById('tower-modal')) closeModal();
}

// Upload Modal
function openUploadModal(towerId, pointId, defaultType) {
  const tower = state.towers.find(t => t.id === towerId);
  const pt = tower && tower.points.find(p => p.id === pointId);
  
  if (!pt) return;
  
  // Validation: Cannot upload removal photo if no installation photo exists
  if (defaultType === 'remove' && pt.status === 'none') {
    alert("오류: 설치사진을 먼저 등록해야 철거사진을 등록할 수 있습니다.");
    return;
  }
  
  state.selectedTowerId = towerId;
  state.selectedPointId = pointId;
  setUploadType(defaultType);
  resetUploadModal();
  document.getElementById('upload-modal').classList.add('active');
}

function closeUploadModal() {
  document.getElementById('upload-modal').classList.remove('active');
  state.selectedPointId = null;
  state.pendingPhotoData = null;
}

function closeUploadModalOutside(e) {
  if (e.target === document.getElementById('upload-modal')) closeUploadModal();
}

function setUploadType(type) {
  // Enforce rule within modal toggle too
  const tower = state.towers.find(t => t.id === state.selectedTowerId);
  const pt = tower && tower.points.find(p => p.id === state.selectedPointId);
  
  if (type === 'remove' && pt && pt.status === 'none') {
    alert("오류: 접지 설치가 완료되지 않아 철거사진을 등록할 수 없습니다.");
    return;
  }
  
  state.uploadType = type;
  document.getElementById('btn-install').classList.toggle('active', type === 'install');
  document.getElementById('btn-remove').classList.toggle('active', type === 'remove');
}

function resetUploadModal() {
  document.getElementById('upload-placeholder').style.display = 'flex';
  document.getElementById('upload-preview').style.display = 'none';
  document.getElementById('preview-img').src = '';
  document.getElementById('btn-do-upload').disabled = true;
  document.getElementById('file-input').value = '';
  state.pendingPhotoData = null;
}

function triggerFileInput() {
  document.getElementById('file-input').click();
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Compress image
  compressImage(file, 800, 0.7, (compressedDataUrl, originalSize, compressedSize) => {
    state.pendingPhotoData = compressedDataUrl;
    
    document.getElementById('upload-placeholder').style.display = 'none';
    document.getElementById('upload-preview').style.display = 'flex';
    document.getElementById('preview-img').src = compressedDataUrl;
    document.getElementById('preview-info').textContent = 
      `압축됨: ${(originalSize/1024).toFixed(1)}KB → ${(compressedSize/1024).toFixed(1)}KB`;
      
    document.getElementById('btn-do-upload').disabled = false;
  });
}

function doUpload() {
  if (!state.selectedTowerId || !state.selectedPointId || !state.pendingPhotoData) return;
  
  const btn = document.getElementById('btn-do-upload');
  const spinner = document.getElementById('upload-spinner');
  
  btn.disabled = true;
  spinner.style.display = 'block';
  
  setTimeout(() => {
    const tower = state.towers.find(t => t.id === state.selectedTowerId);
    if (!tower) return;
    
    const pt = tower.points.find(p => p.id === state.selectedPointId);
    if (!pt) return;
    
    const newStatus = state.uploadType === 'install' ? 'grounding' : 'removed';
    const msgStatus = newStatus === 'grounding' ? '접지설치' : '작업완료(철거)';
    
    pt.status = newStatus;
    pt.history.push({
      status: newStatus,
      timestamp: new Date().getTime(),
      photo: state.pendingPhotoData 
    });
    
    saveData();
    renderDashboard();
    renderTowers();
    openTowerModal(state.selectedTowerId);
    
    spinner.style.display = 'none';
    closeUploadModal();
    showToast(`${msgStatus} 처리가 완료되었습니다.`);
  }, 500);
}

// Image Compression
function compressImage(file, maxDimension, quality, callback) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function(event) {
    const img = new Image();
    img.src = event.target.result;
    img.onload = function() {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDimension) {
          height *= maxDimension / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width *= maxDimension / height;
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      const origSize = file.size;
      const compSize = Math.round((compressedDataUrl.length - 22) * 3 / 4);
      
      callback(compressedDataUrl, origSize, compSize);
    };
  };
}

// Photo Viewer & Deletion
function viewPhoto(towerId, pointId) {
  const tower = state.towers.find(t => t.id === towerId);
  const pt = tower && tower.points.find(p => p.id === pointId);
  
  if (!pt || pt.history.length === 0) return;
  
  state.viewingPhoto = { towerId, pointId };
  
  const lastUpdate = pt.history[pt.history.length - 1];
  
  document.getElementById('photo-view-img').src = lastUpdate.photo;
  
  const d = new Date(lastUpdate.timestamp);
  const dateStr = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  const statusStr = lastUpdate.status === 'grounding' ? '✅ 설치사진' : '✅ 철거사진';
  
  document.getElementById('photo-view-info').textContent = `[${pt.name}] ${statusStr} (${dateStr})`;
  document.getElementById('photo-modal').classList.add('active');
}

function closePhotoModal() {
  document.getElementById('photo-modal').classList.remove('active');
  state.viewingPhoto = null;
}

function deleteCurrentPhoto() {
  if (!state.viewingPhoto) return;
  
  if (!confirm("해당 사진 및 처리 기록을 완전히 삭제하시겠습니까?\n삭제 후에는 이전 상태로 돌아갑니다.")) {
    return;
  }
  
  const tower = state.towers.find(t => t.id === state.viewingPhoto.towerId);
  const pt = tower && tower.points.find(p => p.id === state.viewingPhoto.pointId);
  
  if (!pt || pt.history.length === 0) return;
  
  // Remove last history entry
  const deletedEntry = pt.history.pop();
  
  // Revert status
  if (pt.history.length > 0) {
    pt.status = pt.history[pt.history.length - 1].status;
  } else {
    pt.status = 'none';
  }
  
  saveData();
  
  closePhotoModal();
  renderDashboard();
  renderTowers();
  openTowerModal(state.viewingPhoto.towerId); // Refresh modal view
  
  showToast(`기록이 삭제되어 '${pt.status === 'none' ? '미등록' : '접지설치됨'}' 상태로 돌아갔습니다.`);
}

// UI Utilities
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Start
document.addEventListener('DOMContentLoaded', init);
