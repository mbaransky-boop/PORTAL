import React from 'react';
import { ConnectionStatus } from '../../shared/types';
import { theme } from '../theme';

interface StatusIndicatorProps {
  status: ConnectionStatus;
}

const statusConfig: Record<ConnectionStatus, { color: string; label: string; animate: boolean }> = {
  offline: { color: theme.colors.textDisabled, label: 'Offline', animate: false },
  connecting: { color: theme.colors.warning, label: 'Łączenie...', animate: true },
  connected: { color: theme.colors.success, label: 'Połączono', animate: false },
  error: { color: theme.colors.error, label: 'Błąd połączenia', animate: false },
};

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const config = statusConfig[status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: config.color, boxShadow: `0 0 8px ${config.color}`, animation: config.animate ? 'glowPulse 1.5s ease-in-out infinite' : undefined }} />
      <span style={{ fontSize: theme.typography.caption.size, color: config.color, fontWeight: '500', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {config.label}
      </span>
    </div>
  );
}
