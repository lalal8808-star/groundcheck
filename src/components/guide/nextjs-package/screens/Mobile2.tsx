'use client';

import React from 'react';
import { AppHeader, AppNav } from '../chrome/AppChrome';
import {
  brandPrimary, brandPrimaryHover, appBg,
  statusInstall, statusRemove, statusExclude, statusNone, brandYellow, clamp,
} from '../tokens';

interface MobileTowerGridProps {
  selectMode?: boolean;
  selectedCount?: number;
  showBulkBar?: boolean;
  bulkPressed?: boolean;
  highlightTower?: number;
}

export function MobileTowerGrid({
  selectMode = false, selectedCount = 0,
  showBulkBar = false, bulkPressed = false, highlightTower = -1,
}: MobileTowerGridProps) {
  const towers = ['S/S', '1호', '2호', '3호', '4호', '5호', '6호', '7호', '8호'];
  const selectedIdx = [4, 5, 6].slice(0, selectedCount);
  type S = 'grounding' | 'removed' | 'exempt' | 'none';
  const seedState = (ti: number, phase: number, isMain: boolean): S => {
    const seed = (ti * 3 + phase * 7 + (isMain ? 0 : 11)) % 13;
    if (ti === 0) return 'exempt';
    if (seed < 4) return 'removed';
    if (seed < 7) return 'grounding';
    if (seed < 9) return 'exempt';
    return 'none';
  };
  const statusColor: Record<S, string> = {
    grounding: statusInstall, removed: statusRemove,
    exempt: statusExclude, none: statusNone,
  };

  return (
    <div style={{
      width: '100%', height: '100%', ...appBg,
      fontFamily: 'Pretendard, -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      <AppHeader />
      <AppNav active="towers" />
      {selectMode && (
        <div style={{ padding: '0 12px 6px' }}>
          <div style={{
            background: '#eff6ff', border: `1px solid ${brandPrimary}`, borderRadius: 10,
            padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 10, fontWeight: 700, color: brandPrimary,
          }}>
            <span>✓ 선택 모드 · {selectedCount}기 선택됨</span>
            <span style={{ color: '#64748b', fontWeight: 600 }}>취소</span>
          </div>
        </div>
      )}
      <div style={{
        flex: 1, padding: '0 12px 14px',
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
        alignContent: 'start', overflow: 'hidden',
      }}>
        {towers.map((t, i) => {
          const isSelected = selectedIdx.includes(i);
          const isHl = highlightTower === i;
          return (
            <div key={t} style={{
              aspectRatio: '1',
              background: isSelected ? '#eff6ff' : 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(12px)',
              borderRadius: 12,
              border: isSelected
                ? `2px solid ${brandPrimary}`
                : (isHl ? `2px solid ${brandYellow}` : '1px solid rgba(226,232,240,0.8)'),
              boxShadow: isSelected
                ? '0 8px 16px rgba(37,99,235,0.2), 0 0 0 4px rgba(37,99,235,0.1)'
                : (isHl ? '0 10px 25px rgba(245,176,26,0.35)' : '0 4px 6px -1px rgba(0,0,0,0.05)'),
              transform: isSelected ? 'scale(1.02)' : (isHl ? 'translateY(-3px) scale(1.03)' : 'scale(1)'),
              transition: 'all 200ms', position: 'relative',
              padding: '8px 4px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {selectMode && (
                <div style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 16, height: 16, borderRadius: '50%',
                  background: isSelected ? brandPrimary : 'white',
                  border: `1.5px solid ${isSelected ? brandPrimary : '#cbd5e1'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: 'white', fontWeight: 800,
                }}>{isSelected && '✓'}</div>
              )}
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{t}</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map((p) => {
                  const mainS = seedState(i, p, true);
                  const subS = seedState(i, p, false);
                  return (
                    <div key={p} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[mainS, subS].map((s, k) => s === 'exempt' ? (
                          <span key={k} style={{
                            width: 8, height: 8, fontSize: 6, fontWeight: 900,
                            color: statusExclude, display: 'inline-flex',
                            alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                          }}>✕</span>
                        ) : (
                          <div key={k} style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: statusColor[s],
                            boxShadow: s === 'grounding' ? '0 0 4px rgba(239,68,68,0.5)'
                              : s === 'removed' ? '0 0 4px rgba(16,185,129,0.5)' : 'none',
                          }}/>
                        ))}
                      </div>
                      <span style={{ fontSize: 7, color: '#64748b', fontWeight: 700 }}>{['A','B','C'][p]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {showBulkBar && (
        <div style={{
          position: 'absolute', left: 10, right: 10, bottom: 12,
          background: 'white', borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          padding: '8px 10px',
          display: 'flex', gap: 6, alignItems: 'center',
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#0f172a' }}>{selectedCount}기 선택</span>
          <div style={{ flex: 1 }}/>
          <div style={{
            padding: '7px 12px',
            background: bulkPressed ? statusExclude : 'linear-gradient(135deg, #94a3b8, #64748b)',
            color: 'white', borderRadius: 8,
            fontSize: 10, fontWeight: 700,
            boxShadow: bulkPressed ? 'inset 0 2px 4px rgba(0,0,0,0.2)' : '0 4px 10px rgba(100,116,139,0.3)',
            transform: bulkPressed ? 'scale(0.97)' : 'scale(1)',
            transition: 'all 150ms',
          }}>일괄 비대상</div>
        </div>
      )}
    </div>
  );
}

interface MobileTowerDetailProps {
  step?: number;
}

export function MobileTowerDetail({ step = 0 }: MobileTowerDetailProps) {
  const s = clamp(step, 0, 3);
  type Status = 'none' | 'grounding' | 'removed';
  const mainStatus: Status = s < 1 ? 'none' : s < 2 ? 'grounding' : 'removed';
  const mainStatusLabel = ({ none: '미등록', grounding: '접지중', removed: '철거완료' } as const)[mainStatus];
  const highlightBtn: 'install' | 'remove' | null =
    s === 1 ? 'install' : s === 2 ? 'remove' : null;

  return (
    <div style={{
      width: '100%', height: '100%', ...appBg,
      fontFamily: 'Pretendard, -apple-system, sans-serif',
      position: 'relative', display: 'flex', flexDirection: 'column',
    }}>
      <AppHeader />
      <AppNav active="towers" />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: 14, paddingTop: 52,
      }}>
        <div style={{
          width: '100%', background: 'white',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
          overflow: 'hidden', maxHeight: 'calc(100% - 60px)',
        }}>
          <div style={{
            padding: '12px 14px 8px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>3호 · 접지점 상세</div>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <div style={{
                padding: '3px 7px', background: '#f1f5f9', borderRadius: 5,
                fontSize: 9, color: '#64748b', fontWeight: 600,
              }}>📋 작업이력</div>
              <div style={{ fontSize: 15, color: '#64748b', padding: '0 3px' }}>✕</div>
            </div>
          </div>
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <PhaseCard phase="A">
              <PointRow isMain status={mainStatus} statusLabel={mainStatusLabel} highlightBtn={highlightBtn} />
              <PointRow isMain={false} status="removed" statusLabel="철거완료" />
            </PhaseCard>
            <PhaseCard phase="B">
              <PointRow isMain status="grounding" statusLabel="접지중" />
              <PointRow isMain={false} status="exempt" statusLabel="비대상" />
            </PhaseCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhaseCard({ phase, children }: { phase: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 10, border: `2px solid ${brandPrimary}`, overflow: 'hidden' }}>
      <div style={{ background: brandPrimary, color: 'white', fontWeight: 800, fontSize: 11, padding: '5px 10px' }}>{phase}상</div>
      <div style={{ padding: 7, background: 'white', display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}

interface PointRowProps {
  isMain?: boolean;
  status?: 'none' | 'grounding' | 'removed' | 'exempt';
  statusLabel?: string;
  highlightBtn?: 'install' | 'remove' | null;
}

function PointRow({ isMain = true, status = 'none', statusLabel = '미등록', highlightBtn = null }: PointRowProps) {
  const typeLabel = isMain ? '주접지' : '보조접지';
  const statusBgColor = ({
    grounding: 'rgba(239,68,68,0.12)',
    removed: 'rgba(16,185,129,0.12)',
    exempt: 'rgba(148,163,184,0.15)',
    none: '#f1f5f9',
  } as const)[status];
  const statusFgColor = ({
    grounding: statusInstall, removed: statusRemove,
    exempt: statusExclude, none: '#64748b',
  } as const)[status];

  return (
    <div style={{
      padding: '7px 9px',
      background: isMain ? '#eff6ff' : '#f8fafc',
      borderRadius: 8,
      border: `1px solid ${isMain ? '#bfdbfe' : '#e2e8f0'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: isMain ? brandPrimary : '#0f172a' }}>{typeLabel}</span>
        <span style={{
          fontSize: 8, fontWeight: 700,
          padding: '2px 7px', borderRadius: 999,
          background: statusBgColor, color: statusFgColor,
        }}>{statusLabel}</span>
      </div>
      {status !== 'none' && (
        <div style={{ fontSize: 8, color: '#94a3b8', marginBottom: 5 }}>
          관리: OO전력 김현장 (14:32)
        </div>
      )}
      <div style={{ display: 'flex', gap: 4 }}>
        {status !== 'none' && <ActionBtn variant="outline">기록보기</ActionBtn>}
        <ActionBtn variant="primary" active={highlightBtn === 'install'}>설치</ActionBtn>
        {status === 'grounding' && (
          <ActionBtn variant="remove" active={highlightBtn === 'remove'}>철거</ActionBtn>
        )}
        <ActionBtn variant="exempt">비대상</ActionBtn>
      </div>
    </div>
  );
}

interface ActionBtnProps {
  variant?: 'outline' | 'primary' | 'remove' | 'exempt';
  active?: boolean;
  children: React.ReactNode;
}

function ActionBtn({ variant = 'outline', active = false, children }: ActionBtnProps) {
  const styles = ({
    outline: { bg: 'white', color: '#64748b', border: '#e2e8f0' },
    primary: {
      bg: `linear-gradient(135deg, ${brandPrimary}, ${brandPrimaryHover})`,
      color: 'white', border: 'transparent',
    },
    remove: {
      bg: active ? statusRemove : 'white',
      color: active ? 'white' : statusRemove,
      border: statusRemove,
    },
    exempt: { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
  } as const)[variant];

  return (
    <div style={{
      flex: 1, height: 24, padding: '0 6px',
      background: styles.bg, color: styles.color,
      border: `1px solid ${styles.border}`,
      borderRadius: 6,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 9, fontWeight: 700,
      boxShadow: active
        ? (variant === 'primary'
            ? '0 0 0 3px rgba(37,99,235,0.25), 0 4px 10px rgba(37,99,235,0.4)'
            : '0 0 0 3px rgba(16,185,129,0.25), 0 4px 10px rgba(16,185,129,0.4)')
        : (variant === 'primary' ? '0 4px 12px rgba(37,99,235,0.3)' : 'none'),
      transform: active ? 'scale(1.05)' : 'scale(1)',
      transition: 'all 150ms', whiteSpace: 'nowrap',
    }}>{children}</div>
  );
}
