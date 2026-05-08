'use client';

import React from 'react';
import { useTime } from './Stage';
import { clamp } from '../tokens';

export const Easing = {
  linear: (t: number) => t,
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeIn: (t: number) => t * t * t,
};

export function interpolate(
  t: number,
  inputRange: [number, number],
  outputRange: [number, number],
  ease: (t: number) => number = Easing.linear
): number {
  const [inMin, inMax] = inputRange;
  const [outMin, outMax] = outputRange;
  const local = clamp((t - inMin) / (inMax - inMin), 0, 1);
  return outMin + ease(local) * (outMax - outMin);
}

interface SpriteProps {
  start: number;
  end: number;
  /** Fade in/out in seconds. Default: 0.3 */
  fade?: number;
  children: React.ReactNode | ((local: number) => React.ReactNode);
  style?: React.CSSProperties;
}

/**
 * Renders children only while the timeline is between [start, end].
 * Provides a normalized local time (0..1 across visible window) when
 * children is a function.
 */
export function Sprite({ start, end, fade = 0.3, children, style }: SpriteProps) {
  const t = useTime();
  if (t < start - 0.05 || t > end + 0.05) return null;

  const dur = end - start;
  const local = clamp((t - start) / dur, 0, 1);

  let opacity = 1;
  if (fade > 0) {
    if (t < start + fade) opacity = (t - start) / fade;
    else if (t > end - fade) opacity = (end - t) / fade;
    opacity = clamp(opacity, 0, 1);
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      opacity,
      transition: 'opacity 80ms linear',
      ...style,
    }}>
      {typeof children === 'function' ? children(local) : children}
    </div>
  );
}

/** Useful inside Sprite render-prop. Returns local 0..1 time within current Sprite window. */
export function useSprite(start: number, end: number): number {
  const t = useTime();
  return clamp((t - start) / (end - start), 0, 1);
}
