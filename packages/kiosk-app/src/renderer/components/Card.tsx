import React from 'react';
import { theme } from '../theme';

interface CardProps {
  children: React.ReactNode;
  glow?: boolean;
  style?: React.CSSProperties;
}

export function Card({ children, glow, style }: CardProps) {
  return (
    <div style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.surfaceBorder}`, borderRadius: theme.radius.lg, padding: theme.spacing.xl, boxShadow: glow ? theme.shadows.glowStrong : theme.shadows.card, ...style }}>
      {children}
    </div>
  );
}
