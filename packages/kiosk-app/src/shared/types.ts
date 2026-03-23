export type ConnectionStatus = 'offline' | 'connecting' | 'connected' | 'error';
export type GameType = 'tictactoe' | 'battleship' | null;
export type Screen = 'home' | 'call' | 'tictactoe' | 'battleship';

export type TicTacToeSymbol = 'X' | 'O' | null;
export type TicTacToeBoard = TicTacToeSymbol[];

export interface TicTacToeState {
  board: TicTacToeBoard;
  currentPlayer: 'X' | 'O';
  winner: TicTacToeSymbol | 'draw' | null;
  mySymbol: 'X' | 'O' | null;
}

export type BattleshipCellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';
export type BattleshipPhase = 'placing' | 'playing' | 'finished';

export interface BattleshipCell {
  state: BattleshipCellState;
  shipId?: number;
}

export interface BattleshipShip {
  id: number;
  size: number;
  name: string;
  cells: Array<{ row: number; col: number }>;
  hits: number;
  sunk: boolean;
}

export interface BattleshipBoard {
  cells: BattleshipCell[][];
  ships: BattleshipShip[];
}

export interface BattleshipState {
  phase: BattleshipPhase;
  myBoard: BattleshipBoard;
  opponentBoard: BattleshipBoard;
  myTurn: boolean;
  winner: 'me' | 'opponent' | null;
  placingShipIndex: number;
  placingOrientation: 'horizontal' | 'vertical';
  opponentReady: boolean;
  iReady: boolean;
}

export interface SignalingMessage {
  type: string;
  payload?: unknown;
  from?: string;
  to?: string;
}

export interface AppConfig {
  signalingUrl: string;
  deviceId: string;
  secret: string;
  kioskMode: boolean;
}
