import React, { useEffect } from 'react';
import { AppProvider, useAppState, useAppDispatch } from './store/appStore';
import { signalingService } from './services/signalingService';
import { webrtcService } from './services/webrtcService';
import { HomeScreen } from './screens/HomeScreen';
import { CallScreen } from './screens/CallScreen';
import { TicTacToeScreen } from './screens/TicTacToeScreen';
import { BattleshipScreen } from './screens/BattleshipScreen';
import { AppConfig } from '../shared/types';

declare global {
  interface Window {
    portalAPI?: {
      getConfig: () => Promise<AppConfig>;
      restart: () => Promise<void>;
      logError: (message: string) => void;
      onAppEvent: (callback: (event: string) => void) => void;
    };
  }
}

function AppInner() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const loadConfig = async () => {
      let config: AppConfig;
      if (window.portalAPI) {
        config = await window.portalAPI.getConfig();
      } else {
        config = { signalingUrl: 'ws://localhost:8080', deviceId: 'kiosk-dev', secret: 'portal-secret-change-me', kioskMode: false };
      }
      dispatch({ type: 'SET_CONFIG', config });
      dispatch({ type: 'SET_CONNECTION_STATUS', status: 'connecting' });
      signalingService.connect(config.signalingUrl, config.deviceId, config.secret);
    };
    loadConfig().catch(console.error);
  }, [dispatch]);

  useEffect(() => {
    const unsubConnected = signalingService.on('registered', () => { dispatch({ type: 'SET_CONNECTION_STATUS', status: 'connected' }); });
    const unsubPeerConnected = signalingService.on('peer_connected', () => { dispatch({ type: 'SET_PEER_CONNECTED', connected: true }); });
    const unsubPeerDisconnected = signalingService.on('peer_disconnected', () => { dispatch({ type: 'SET_PEER_CONNECTED', connected: false }); });
    const unsubError = signalingService.on('error', (data) => { dispatch({ type: 'SET_ERROR', error: String(data) }); dispatch({ type: 'SET_CONNECTION_STATUS', status: 'error' }); });
    const unsubReconnecting = signalingService.on('reconnecting', () => { dispatch({ type: 'SET_CONNECTION_STATUS', status: 'connecting' }); });
    return () => { unsubConnected(); unsubPeerConnected(); unsubPeerDisconnected(); unsubError(); unsubReconnecting(); };
  }, [dispatch]);

  useEffect(() => {
    webrtcService.on('localStream', (stream: unknown) => { dispatch({ type: 'SET_LOCAL_STREAM', stream: stream as MediaStream }); });
    webrtcService.on('remoteStream', (stream: unknown) => { dispatch({ type: 'SET_REMOTE_STREAM', stream: stream as MediaStream }); });
  }, [dispatch]);

  if (!state.config) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', color: '#ff2d78', fontSize: '24px', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '16px', animation: 'spin 1s linear infinite', display: 'inline-block', border: '3px solid rgba(255,45,120,0.3)', borderTop: '3px solid #ff2d78', borderRadius: '50%', width: '48px', height: '48px' }} />
          <div>Ładowanie...</div>
        </div>
      </div>
    );
  }

  switch (state.screen) {
    case 'home': return <HomeScreen />;
    case 'call': return <CallScreen />;
    case 'tictactoe': return <TicTacToeScreen />;
    case 'battleship': return <BattleshipScreen />;
    default: return <HomeScreen />;
  }
}

export default function App() {
  return <AppProvider><AppInner /></AppProvider>;
}
