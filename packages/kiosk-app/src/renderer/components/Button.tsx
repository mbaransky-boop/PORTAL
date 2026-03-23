import React from 'react';
import { theme } from '../theme';

interface ButtonProps {
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
  style?: React.CSSProperties;
}

export function Button({ onClick, variant = 'primary', disabled, children, fullWidth, style }: ButtonProps) {
  const getStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      minHeight: theme.button.minHeight,
      minWidth: theme.button.minWidth,
      padding: theme.button.padding,
      borderRadius: theme.radius.md,
      fontSize: theme.typography.body.size,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily,
      cursor: disabled ? 'not-allowed' : 'pointer',
      border: 'none',
      transition: `all ${theme.transitions.normal}`,
      width: fullWidth ? '100%' : undefined,
      opacity: disabled ? 0.5 : 1,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    };
    switch (variant) {
      case 'primary':
        return { ...base, background: `linear-gradient(135deg, ${theme.colors.accentPrimary}, ${theme.colors.accentSecondary})`, color: '#ffffff', boxShadow: disabled ? 'none' : theme.shadows.glow };
      case 'secondary':
        return { ...base, background: theme.colors.surfaceElevated, color: theme.colors.textPrimary, border: `1px solid ${theme.colors.surfaceBorder}` };
      case 'danger':
        return { ...base, background: theme.colors.error, color: '#ffffff', boxShadow: disabled ? 'none' : `0 0 20px ${theme.colors.errorGlow}` };
      case 'ghost':
        return { ...base, background: 'transparent', color: theme.colors.accentPrimary, border: `1px solid ${theme.colors.accentPrimary}` };
    }
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...getStyles(), ...style }} disabled={disabled}>
      {children}
    </button>
  );
}
