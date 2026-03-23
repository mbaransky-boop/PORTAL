import React from 'react';
import { theme } from '../theme';

interface PortalRingProps {
  size?: number;
  active?: boolean;
}

export function PortalRing({ size = 300, active = false }: PortalRingProps) {
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: `2px solid ${theme.colors.accentPrimary}`, boxShadow: active ? theme.shadows.glowStrong : theme.shadows.glow, animation: active ? 'glowPulse 2s ease-in-out infinite' : 'ringPulse 4s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: '80%', height: '80%', borderRadius: '50%', border: `1px solid rgba(255, 45, 120, 0.4)`, animation: 'spin 20s linear infinite' }} />
      <div style={{ position: 'absolute', width: '60%', height: '60%', borderRadius: '50%', border: `1px solid rgba(255, 45, 120, 0.2)`, animation: 'spin 15s linear infinite reverse' }} />
      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: theme.colors.accentPrimary, boxShadow: theme.shadows.glowStrong }} />
    </div>
  );
}
