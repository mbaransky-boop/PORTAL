type EventCallback = (data: unknown) => void;

class SignalingService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, EventCallback[]> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private deviceId = '';
  private secret = '';
  private url = '';
  private intentionalClose = false;

  connect(url: string, deviceId: string, secret: string): void {
    this.url = url;
    this.deviceId = deviceId;
    this.secret = secret;
    this.intentionalClose = false;
    this.reconnectAttempts = 0;
    this.doConnect();
  }

  private doConnect(): void {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
    }

    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectAttempts = 0;
      ws.send(JSON.stringify({
        type: 'register',
        payload: { deviceId: this.deviceId, secret: this.secret },
      }));
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data as string) as { type: string; payload?: unknown; from?: string };
        this.emit(message.type, message.payload);
      } catch {
        // Ignore parse errors
      }
    };

    ws.onclose = () => {
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };

    ws.onerror = (event) => {
      this.emit('error', event);
    };
  }

  send(type: string, payload?: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  on(event: string, callback: EventCallback): () => void {
    const cbs = this.listeners.get(event) || [];
    cbs.push(callback);
    this.listeners.set(event, cbs);
    return () => {
      const current = this.listeners.get(event) || [];
      this.listeners.set(event, current.filter(cb => cb !== callback));
    };
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private emit(event: string, data: unknown): void {
    const cbs = this.listeners.get(event) || [];
    cbs.forEach(cb => cb(data));
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', 'Max reconnect attempts reached');
      return;
    }
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });
    this.reconnectTimer = setTimeout(() => {
      this.doConnect();
    }, delay);
  }
}

export const signalingService = new SignalingService();
