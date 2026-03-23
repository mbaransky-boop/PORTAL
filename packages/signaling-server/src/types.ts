export type MessageType =
  | 'register'
  | 'registered'
  | 'peer_connected'
  | 'peer_disconnected'
  | 'offer'
  | 'answer'
  | 'ice_candidate'
  | 'game_state'
  | 'game_action'
  | 'ping'
  | 'pong'
  | 'error';

export interface SignalingMessage {
  type: MessageType;
  payload?: unknown;
  from?: string;
  to?: string;
}

export interface RegisterPayload {
  deviceId: string;
  secret: string;
}

export interface KioskClient {
  deviceId: string;
  ws: import('ws').WebSocket;
  connectedAt: number;
}
