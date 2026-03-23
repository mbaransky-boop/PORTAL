import React, { useCallback } from 'react';
import { useAppState, useAppDispatch } from '../store/appStore';
import { signalingService } from '../services/signalingService';
import { webrtcService } from '../services/webrtcService';
import { Button } from '../components/Button';
import { StatusIndicator } from '../components/StatusIndicator';
import { PortalRing } from '../components/PortalRing';
import { theme } from '../theme';

export function HomeScreen() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const handleConnect = useCallback(() => {
    if (!state.config) return;
    dispatch({ type: 'SET_CONNECTION_STATUS', status: 'connecting' });
    signalingService.connect(state.config.signalingUrl, state.config.deviceId, state.config.secret);
  }, [state.config, dispatch]);

  const handleDisconnect = useCallback(() => {
    signalingService.disconnect();
    webrtcService.endCall();
    dispatch({ type: 'SET_CONNECTION_STATUS', status: 'offline' });
    dispatch({ type: 'SET_PEER_CONNECTED', connected: false });
    dispatch({ type: 'SET_LOCAL_STREAM', stream: null });
    dispatch({ type: 'SET_REMOTE_STREAM', stream: null });
  }, [dispatch]);

  const handleCall = useCallback(() => {
    const isInitiator = !(state.config?.deviceId ?? '').includes('2');
    dispatch({ type: 'SET_SCREEN', screen: 'call' });
    webrtcService.startCall(isInitiator).catch(console.error);
  }, [dispatch, state.config]);

  const handleTicTacToe = useCallback(() => {
    const mySymbol = (state.config?.deviceId ?? '').endsWith('2') ? 'O' : 'X';
    dispatch({ type: 'UPDATE_TICTACTOE', state: { mySymbol, board: Array(9).fill(null), currentPlayer: 'X', winner: null } });
    dispatch({ type: 'SET_SCREEN', screen: 'tictactoe' });
  }, [dispatch, state.config]);

  const handleBattleship = useCallback(() => {
    dispatch({ type: 'SET_SCREEN', screen: 'battleship' });
  }, [dispatch]);

  const isConnected = state.connectionStatus === 'connected';
  const isPeerConnected = state.isPeerConnected;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: theme.colors.background,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: theme.typography.fontFamily,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background radial glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(255,45,120,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Top-right status */}
      <div style={{ position: 'absolute', top: theme.spacing.xl, right: theme.spacing.xl }}>
        <StatusIndicator status={state.connectionStatus} />
      </div>

      {/* Top-left device ID */}
      {state.config && (
        <div style={{
          position: 'absolute', top: theme.spacing.xl, left: theme.spacing.xl,
          fontSize: theme.typography.caption.size, color: theme.colors.textDisabled,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          {state.config.deviceId}
        </div>
      )}

      {/* Main content */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: theme.spacing.xxl, animation: 'fadeIn 0.5s ease',
      }}>
        {/* Portal ring + title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: theme.spacing.xl }}>
          <PortalRing size={220} active={isPeerConnected} />
          <div>
            <h1 style={{
              fontSize: theme.typography.display.size,
              fontWeight: theme.typography.display.weight,
              color: theme.colors.textPrimary,
              letterSpacing: '0.3em',
              textAlign: 'center',
              textShadow: `0 0 40px ${theme.colors.accentGlow}, 0 0 80px ${theme.colors.accentGlow}`,
            }}>
              PORTAL
            </h1>
            <p style={{
              fontSize: theme.typography.caption.size, color: theme.colors.textSecondary,
              textAlign: 'center', letterSpacing: '0.15em', textTransform: 'uppercase',
              marginTop: theme.spacing.sm,
            }}>
              {isPeerConnected
                ? 'Portal połączony'
                : isConnected
                  ? 'Oczekiwanie na drugi portal...'
                  : 'Portal offline'}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: theme.spacing.md,
          alignItems: 'center', width: '100%', minWidth: '340px',
        }}>
          {!isConnected ? (
            <Button onClick={handleConnect} variant="primary" fullWidth>
              POŁĄCZ
            </Button>
          ) : (
            <Button onClick={handleDisconnect} variant="ghost" fullWidth>
              ROZŁĄCZ
            </Button>
          )}

          {isPeerConnected && (
            <Button onClick={handleCall} variant="primary" fullWidth>
              📹  POŁĄCZENIE VIDEO
            </Button>
          )}

          {isPeerConnected && (
            <>
              <Button onClick={handleTicTacToe} variant="secondary" fullWidth>
                ✕○  KÓŁKO I KRZYŻYK
              </Button>
              <Button onClick={handleBattleship} variant="secondary" fullWidth>
                ⊕  STATKI
              </Button>
            </>
          )}
        </div>

        {/* Error */}
        {state.error && (
          <div style={{
            color: theme.colors.error, fontSize: theme.typography.caption.size,
            textAlign: 'center', maxWidth: '360px',
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            background: `rgba(239,68,68,0.1)`, borderRadius: theme.radius.sm,
            border: `1px solid ${theme.colors.error}`,
          }}>
            {state.error}
          </div>
        )}
      </div>
    </div>
  );
}
