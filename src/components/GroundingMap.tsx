'use client';

import { useState, useMemo } from 'react';
import { Map, MapMarker, MarkerClusterer, useKakaoLoader, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { Tower } from '@/lib/types';

export default function GroundingMap({
  towers,
  currentCircuit,
  onTowerClick
}: {
  towers: Tower[];
  currentCircuit: number;
  onTowerClick: (towerId: string) => void;
}) {
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY || '',
    libraries: ['clusterer', 'services']
  });

  const [filter, setFilter] = useState<'all' | 'grounding' | 'removed' | 'exempt' | 'none'>('all');

  // 마커 추출 (GPS 좌표가 하나라도 있는 철탑)
  const mapData = useMemo(() => {
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

    return towers.map(tower => {
      const status = getTowerOverallStatus(tower);
      
      let finalLat: number | null = tower.lat || null;
      let finalLng: number | null = tower.lng || null;
      
      // 설정에서 직접 위치를 지정하지 않은 경우, 가장 최근 사진의 EXIF GPS 사용
      if (!finalLat || !finalLng) {
        const allHistory = tower.points
          .filter(p => p.circuit === currentCircuit)
          .flatMap(p => p.history)
          .filter(h => h.latitude && h.longitude)
          .sort((a, b) => b.timestamp - a.timestamp);

        if (allHistory.length > 0) {
          finalLat = allHistory[0].latitude ?? null;
          finalLng = allHistory[0].longitude ?? null;
        }
      }

      return {
        tower,
        status,
        lat: finalLat,
        lng: finalLng
      };
    }).filter(data => data.lat && data.lng); // 위치 정보가 있는 철탑만
  }, [towers, currentCircuit]);

  const filteredData = useMemo(() => {
    if (filter === 'all') return mapData;
    if (filter === 'grounding') return mapData.filter(d => d.status === 'grounding');
    if (filter === 'removed') return mapData.filter(d => d.status === 'removed');
    if (filter === 'exempt') return mapData.filter(d => d.status === 'exempt');
    if (filter === 'none') return mapData.filter(d => d.status === 'none');
    return mapData;
  }, [mapData, filter]);

  if (!process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', background: '#fff', borderRadius: '8px' }}>
        <p style={{ color: '#ef4444', fontWeight: 'bold' }}>⚠️ 카카오맵 API 키가 설정되지 않았습니다.</p>
        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '10px' }}>
          .env.local 파일에 NEXT_PUBLIC_KAKAO_MAP_APP_KEY 를 추가해주세요.
        </p>
      </div>
    );
  }

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>지도를 불러오는 중...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>지도를 불러오는데 실패했습니다. API 키와 도메인 설정을 확인해주세요.</div>;

  // 지도 기본 중심점 (데이터가 없으면 서울 중심)
  const defaultCenter = filteredData.length > 0 
    ? { lat: filteredData[0].lat!, lng: filteredData[0].lng! }
    : { lat: 37.5665, lng: 126.9780 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
      {/* 필터 버튼 — 모바일 가로 스크롤 */}
      <div style={{ display: 'flex', gap: '6px', background: '#fff', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {([
          { key: 'all',       label: '전체',   color: '#3b82f6', bg: '#eff6ff',  dot: null },
          { key: 'grounding', label: '접지중', color: '#b91c1c', bg: '#fef2f2',  dot: '#ef4444' },
          { key: 'removed',   label: '철거완료', color: '#047857', bg: '#ecfdf5', dot: '#10b981' },
          { key: 'exempt',    label: '비대상', color: '#b45309', bg: '#fffbeb',  dot: '#f59e0b' },
          { key: 'none',      label: '미작업', color: '#475569', bg: '#f1f5f9',  dot: '#94a3b8' },
        ] as const).map(({ key, label, color, bg, dot }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              flexShrink: 0,
              padding: '6px 12px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              border: filter === key ? `1.5px solid ${color}` : '1.5px solid #e5e7eb',
              background: filter === key ? bg : '#fff',
              color: filter === key ? color : '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, display: 'inline-block', flexShrink: 0 }} />}
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
        <Map
          center={defaultCenter}
          style={{ width: '100%', height: '100%' }}
          level={7}
          mapTypeId={loading ? undefined : (window as any).kakao?.maps?.MapTypeId?.SKYVIEW} // 스카이뷰 기본 설정 (안전하게 접근)
        >
          <MarkerClusterer averageCenter={true} minLevel={8}>
            {filteredData.map((data) => {
              // 마커 색상
              let dotColor = '';
              if (data.status === 'grounding') {
                dotColor = '#ef4444'; // 빨간 — 접지중
              } else if (data.status === 'removed') {
                dotColor = '#10b981'; // 초록 — 철거완료
              } else if (data.status === 'exempt') {
                dotColor = '#f59e0b'; // 노란(amber) — 비대상
              } else {
                dotColor = '#94a3b8'; // 회색 — 미작업
              }

              return (
                <CustomOverlayMap
                  key={data.tower.id}
                  position={{ lat: data.lat!, lng: data.lng! }}
                  yAnchor={0.5} // 세로 중앙이 좌표에 오도록
                  zIndex={0}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onTowerClick(data.tower.id);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    {/* 점: 좌표에 정확히 위치 */}
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: dotColor,
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      flexShrink: 0,
                    }} />
                    {/* 명칭: 점 오른쪽에 표시 — 마커 위치를 가리지 않음 */}
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.88)',
                      color: '#1e293b',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 5px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      whiteSpace: 'nowrap',
                    }}>
                      {data.tower.name}
                    </div>
                  </div>
                </CustomOverlayMap>
              );
            })}
          </MarkerClusterer>
        </Map>
      </div>
    </div>
  );
}
