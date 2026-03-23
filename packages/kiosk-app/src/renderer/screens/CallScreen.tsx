import React, { useCallback } from 'react';
import { useAppState, useAppDispatch } from '../store/appStore';
import { webrtcService } from '../services/webrtcService';
import { VideoPlayer } from '../components/VideoPlayer';
import { Button } from '../components/Button';
import { theme } from '../theme';

export function CallScreen() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const handleBack = useCallback(() => {
    dispatch({ type: 'SET_SCREEN', screen: 'home' });
  }, [dispatch]);

  const handleTicTacToe = useCallback(() => {
    const mySymbol = (state.config?.deviceId ?? '').endsWith('2') ? 'O' : 'X';
    dispatch({ type: 'UPDATE_TICTACTOE', state: { mySymbol, board: Array(9).fill(null), currentPlayer: 'X', winner: null } });
    dispatch({ type: 'SET_SCREEN', screen: 'tictactoe' });
  }, [dispatch, state.config]);

  const handleBattleship = useCallback(() => {
    dispatch({ type: 'SET_SCREEN', screen: 'battleship' });
  }, [dispatch]);

  const handleDisconnect = useCallback(() => {
    webrtcService.endCall();
    dispatch({ type: 'SET_LOCAL_STREAM', stream: null });
    dispatch({ type: 'SET_REMOTE_STREAM', stream: null });
    dispatch({ type: 'SET_SCREEN', screen: 'home' });
  }, [dispatch]);

  const Spinner = () => (
    <div style={{
      width: '48px', height: '48px',
      border: `3px solid ${theme.colors.accentGlow}`,
      borderTop: `3px solid ${theme.colors.accentPrimary}`,
      borderRadius: '50%', animation: 'spin 1s linear infinite',
    }} />
  );

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000', fontFamily: theme.typography.fontFamily }}>
      {/* Remote video - full screen background */}
      {state.remoteStream ? (
        <VideoPlayer
          stream={state.remoteStream}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        />
      ) : (
        <div style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: theme.colors.background,
          flexDirection: 'column', gap: theme.spacing.lg,
        }}>
          <Spinner />
          <span style={{ color: theme.colors.textSecondary, fontSize: theme.typography.body.size }}>
            Łączenie wideo...
          </span>
        </div>
      )}

      {/* Local video - corner */}
      {state.localStream && (
        <div style={{
          position: 'absolute', bottom: '88px', right: '24px',
          width: '240px', height: '180px',
          borderRadius: theme.radius.md, overflow: 'hidden',
          border: `2px solid ${theme.colors.accentPrimary}`,
          boxShadow: theme.shadows.glowStrong,
        }}>
          <VideoPlayer stream={state.localStream} muted style={{ width: '100%', height: '100%' }} />
        </div>
      )}

      {/* Top controls bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: `${theme.spacing.md} ${theme.spacing.xl}`,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)',
        display: 'flex', gap: theme.spacing.sm, alignItems: 'center',
      }}>
        <Button onClick={handleBack} variant="ghost" style={{ minWidth: 'auto', padding: `${theme.spacing.sm} ${theme.spacing.md}`, minHeight: '44px' }}>
          ← Główna
        </Button>
        <Button onClick={handleTicTacToe} variant="secondary" style={{ minWidth: 'auto', padding: `${theme.spacing.sm} ${theme.spacing.md}`, minHeight: '44px' }}>
          ✕○ Kółko i krzyżyk
        </Button>
        <Button onClick={handleBattleship} variant="secondary" style={{ minWidth: 'auto', padding: `${theme.spacing.sm} ${theme.spacing.md}`, minHeight: '44px' }}>
          ⊕ Statki
        </Button>
        <div style={{ flex: 1 }} />
        <Button onClick={handleDisconnect} variant="danger" style={{ minWidth: 'auto', padding: `${theme.spacing.sm} ${theme.spacing.md}`, minHeight: '44px' }}>
          ROZŁĄCZ
        </Button>
      </div>

      {/* Reconnecting overlay */}
      {!state.isPeerConnected && (
        <div style={{
          position: 'absolute', inset: 0,
          background: theme.colors.overlay,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: theme.spacing.lg,
        }}>
          <Spinner />
          <span style={{ color: theme.colors.textPrimary, fontSize: theme.typography.heading.size, fontWeight: '600' }}>
            Ponowne łączenie...
          </span>
          <Button onClick={handleBack} variant="secondary">POWRÓT DO GŁÓWNEJ</Button>
        </div>
      )}
    </div>
  );
}
