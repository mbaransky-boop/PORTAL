import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Screen, ConnectionStatus, TicTacToeState, BattleshipState, AppConfig } from '../../shared/types';

interface AppState {
  screen: Screen;
  connectionStatus: ConnectionStatus;
  isPeerConnected: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  tictactoe: TicTacToeState;
  battleship: BattleshipState;
  config: AppConfig | null;
  error: string | null;
}

type AppAction =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'SET_CONNECTION_STATUS'; status: ConnectionStatus }
  | { type: 'SET_PEER_CONNECTED'; connected: boolean }
  | { type: 'SET_LOCAL_STREAM'; stream: MediaStream | null }
  | { type: 'SET_REMOTE_STREAM'; stream: MediaStream | null }
  | { type: 'UPDATE_TICTACTOE'; state: Partial<TicTacToeState> }
  | { type: 'UPDATE_BATTLESHIP'; state: Partial<BattleshipState> }
  | { type: 'SET_CONFIG'; config: AppConfig }
  | { type: 'SET_ERROR'; error: string | null };

function createInitialBattleshipBoard() {
  const cells = Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => ({ state: 'empty' as const }))
  );
  return { cells, ships: [] };
}

const initialState: AppState = {
  screen: 'home',
  connectionStatus: 'offline',
  isPeerConnected: false,
  localStream: null,
  remoteStream: null,
  tictactoe: {
    board: Array(9).fill(null) as Array<null>,
    currentPlayer: 'X',
    winner: null,
    mySymbol: null,
  },
  battleship: {
    phase: 'placing',
    myBoard: createInitialBattleshipBoard(),
    opponentBoard: createInitialBattleshipBoard(),
    myTurn: false,
    winner: null,
    placingShipIndex: 0,
    placingOrientation: 'horizontal',
    opponentReady: false,
    iReady: false,
  },
  config: null,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SCREEN': return { ...state, screen: action.screen };
    case 'SET_CONNECTION_STATUS': return { ...state, connectionStatus: action.status };
    case 'SET_PEER_CONNECTED': return { ...state, isPeerConnected: action.connected };
    case 'SET_LOCAL_STREAM': return { ...state, localStream: action.stream };
    case 'SET_REMOTE_STREAM': return { ...state, remoteStream: action.stream };
    case 'UPDATE_TICTACTOE': return { ...state, tictactoe: { ...state.tictactoe, ...action.state } };
    case 'UPDATE_BATTLESHIP': return { ...state, battleship: { ...state.battleship, ...action.state } };
    case 'SET_CONFIG': return { ...state, config: action.config };
    case 'SET_ERROR': return { ...state, error: action.error };
    default: return state;
  }
}

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<React.Dispatch<AppAction> | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

export function useAppDispatch(): React.Dispatch<AppAction> {
  const ctx = useContext(AppDispatchContext);
  if (!ctx) throw new Error('useAppDispatch must be used within AppProvider');
  return ctx;
}
