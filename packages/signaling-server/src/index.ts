import { WebSocketServer, WebSocket } from 'ws';
import { KioskClient, SignalingMessage, RegisterPayload } from './types';

const PORT = parseInt(process.env.PORT || '8080', 10);
const SECRET = process.env.PORTAL_SECRET || 'portal-secret-change-me';

const clients = new Map<string, KioskClient>();

function timestamp(): string {
  return new Date().toISOString();
}

function send(ws: WebSocket, message: SignalingMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function getOtherClient(deviceId: string): KioskClient | undefined {
  for (const [id, client] of clients) {
    if (id !== deviceId) return client;
  }
  return undefined;
}

const wss = new WebSocketServer({ port: PORT });

console.log(`[${timestamp()}] PORTAL Signaling Server starting on port ${PORT}`);

wss.on('connection', (ws: WebSocket) => {
  let registeredDeviceId: string | null = null;
  console.log(`[${timestamp()}] New WebSocket connection`);

  ws.on('message', (data: Buffer) => {
    let message: SignalingMessage;
    try {
      message = JSON.parse(data.toString()) as SignalingMessage;
    } catch {
      send(ws, { type: 'error', payload: 'Invalid JSON' });
      return;
    }

    if (message.type === 'register') {
      const payload = message.payload as RegisterPayload;
      if (!payload || payload.secret !== SECRET) {
        send(ws, { type: 'error', payload: 'Invalid secret' });
        ws.close();
        return;
      }
      if (clients.size >= 2) {
        send(ws, { type: 'error', payload: 'Server full' });
        ws.close();
        return;
      }
      const deviceId = payload.deviceId;
      if (clients.has(deviceId)) {
        clients.get(deviceId)!.ws.close();
        clients.delete(deviceId);
      }
      registeredDeviceId = deviceId;
      clients.set(deviceId, { deviceId, ws, connectedAt: Date.now() });
      send(ws, { type: 'registered', payload: { deviceId } });
      console.log(`[${timestamp()}] Client registered: ${deviceId} (total: ${clients.size})`);

      if (clients.size === 2) {
        for (const [id, client] of clients) {
          send(client.ws, { type: 'peer_connected', payload: { peerId: id === deviceId ? getOtherClient(deviceId)?.deviceId : deviceId } });
        }
        console.log(`[${timestamp()}] Both clients connected, notified peer_connected`);
      }
      return;
    }

    if (message.type === 'ping') {
      send(ws, { type: 'pong' });
      return;
    }

    if (!registeredDeviceId) {
      send(ws, { type: 'error', payload: 'Not registered' });
      return;
    }

    const routableTypes = ['offer', 'answer', 'ice_candidate', 'game_state', 'game_action'];
    if (routableTypes.includes(message.type)) {
      const other = getOtherClient(registeredDeviceId);
      if (other) {
        send(other.ws, { ...message, from: registeredDeviceId });
      }
    }
  });

  ws.on('close', () => {
    if (registeredDeviceId) {
      clients.delete(registeredDeviceId);
      console.log(`[${timestamp()}] Client disconnected: ${registeredDeviceId} (total: ${clients.size})`);
      const other = getOtherClient(registeredDeviceId);
      if (other) {
        send(other.ws, { type: 'peer_disconnected', payload: { peerId: registeredDeviceId } });
      }
    }
  });

  ws.on('error', (err) => {
    console.error(`[${timestamp()}] WebSocket error:`, err.message);
  });
});

wss.on('listening', () => {
  console.log(`[${timestamp()}] PORTAL Signaling Server listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log(`[${timestamp()}] Shutting down...`);
  wss.close();
  process.exit(0);
});
