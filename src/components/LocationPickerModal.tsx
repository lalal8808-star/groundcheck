'use client';

import { useState, useEffect } from 'react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';

type SearchResult = {
  place_name?: string;
  address_name: string;
  y: string;
  x: string;
};

export default function LocationPickerModal({
  initialLat,
  initialLng,
  towerName,
  onSave,
  onClose
}: {
  initialLat?: number;
  initialLng?: number;
  towerName: string;
  onSave: (lat: number, lng: number) => void;
  onClose: () => void;
}) {
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY || '',
    libraries: ['clusterer', 'services']
  });

  const [position, setPosition] = useState<{ lat: number; lng: number }>(() => {
    if (initialLat && initialLng) return { lat: initialLat, lng: initialLng };
    return { lat: 37.5665, lng: 126.9780 };
  });

  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = () => {
    if (!keyword.trim() || typeof kakao === 'undefined' || !kakao.maps || !kakao.maps.services) return;
    setShowResults(false);

    const geocoder = new kakao.maps.services.Geocoder();
    const ps = new kakao.maps.services.Places();

    // 1차: 주소 검색 (지번/도로명) — 여러 결과 모두 수집
    geocoder.addressSearch(keyword, (data, status) => {
      if (status === kakao.maps.services.Status.OK && data.length > 0) {
        // 첫 번째 결과가 하나면 바로 이동, 여러 개면 목록 표시
        if (data.length === 1) {
          setPosition({ lat: parseFloat(data[0].y), lng: parseFloat(data[0].x) });
        } else {
          setSearchResults(data.map(d => ({ address_name: d.address_name, y: d.y, x: d.x })));
          setShowResults(true);
        }
      } else {
        // 2차: 키워드(장소) 검색 — 여러 결과 목록 표시
        ps.keywordSearch(keyword, (data2, status2) => {
          if (status2 === kakao.maps.services.Status.OK && data2.length > 0) {
            const results = data2.slice(0, 8).map(d => ({
              place_name: d.place_name,
              address_name: d.address_name,
              y: d.y,
              x: d.x,
            }));
            if (results.length === 1) {
              setPosition({ lat: parseFloat(results[0].y), lng: parseFloat(results[0].x) });
            } else {
              setSearchResults(results);
              setShowResults(true);
            }
          } else {
            alert('주소나 장소를 찾을 수 없습니다. 더 자세한 주소를 입력해보세요.');
          }
        });
      }
    });
  };

  // GPS로 현재 위치 가져오기 시도
  useEffect(() => {
    if (!initialLat || !initialLng) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => { setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
          () => {}
        );
      }
    }
  }, [initialLat, initialLng]);

  if (error) {
    return (
      <div className="modal-overlay active">
        <div className="modal-content glass-card" style={{ maxWidth: '400px' }}>
          <div className="modal-header">
            <h2>위치 설정 오류</h2>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body">카카오맵 로드에 실패했습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content glass-card" style={{ maxWidth: '540px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '85vh', maxHeight: '650px' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', padding: '15px 20px' }}>
          <h2>📍 {towerName} 위치 지정</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* 주소 검색 영역 */}
        <div style={{ padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'relative' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '6px' }}>
            ① 주소 검색으로 이동 → ② 마커를 드래그하거나 지도 클릭으로 정확한 위치 조정 → ③ 저장
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="주소 또는 장소 검색 (예: 경기도 이천시 마장면 표교리 123)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
            <button
              onClick={handleSearch}
              style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              검색
            </button>
          </div>

          {/* 검색 결과 드롭다운 */}
          {showResults && searchResults.length > 0 && (
            <div style={{
              position: 'absolute', left: 16, right: 16, top: '100%',
              background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 9999,
              maxHeight: '220px', overflowY: 'auto'
            }}>
              <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: '#94a3b8', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>
                검색 결과 {searchResults.length}건 — 정확한 위치를 선택하세요
              </div>
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPosition({ lat: parseFloat(r.y), lng: parseFloat(r.x) });
                    setShowResults(false);
                    setKeyword('');
                  }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 14px',
                    border: 'none', borderBottom: i < searchResults.length - 1 ? '1px solid #f1f5f9' : 'none',
                    background: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                >
                  {r.place_name && (
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>{r.place_name}</span>
                  )}
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{r.address_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 지도 */}
        <div style={{ flex: 1, position: 'relative' }} onClick={() => showResults && setShowResults(false)}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
              지도를 불러오는 중...
            </div>
          ) : (
            <Map
              center={position}
              style={{ width: '100%', height: '100%' }}
              level={4}
              mapTypeId={kakao.maps.MapTypeId.SKYVIEW}
              onClick={(_t, mouseEvent) => {
                setPosition({
                  lat: mouseEvent.latLng.getLat(),
                  lng: mouseEvent.latLng.getLng(),
                });
              }}
            >
              <MapMarker
                position={position}
                draggable={true}
                onDragEnd={(marker) => {
                  setPosition({
                    lat: marker.getPosition().getLat(),
                    lng: marker.getPosition().getLng(),
                  });
                }}
              />
            </Map>
          )}
          {/* 좌표 표시 */}
          <div style={{
            position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.55)',
            color: 'white', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', pointerEvents: 'none'
          }}>
            {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </div>
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', background: '#fff', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>취소</button>
          <button
            onClick={() => onSave(position.lat, position.lng)}
            style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            위치 저장
          </button>
        </div>
      </div>
    </div>
  );
}
