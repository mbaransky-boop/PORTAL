import { signalingService } from './signalingService';

type WebRTCEventCallback = (...args: unknown[]) => void;

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private isInitiator = false;
  private listeners: Map<string, WebRTCEventCallback[]> = new Map();
  private signalingUnsubscribers: Array<() => void> = [];

  private readonly rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  async startCall(isInitiator: boolean): Promise<void> {
    this.isInitiator = isInitiator;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.emit('localStream', this.localStream);
    } catch {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.emit('localStream', this.localStream);
    }

    const pc = this.createPeerConnection();
    this.peerConnection = pc;

    this.localStream.getTracks().forEach(track => {
      if (this.localStream) {
        pc.addTrack(track, this.localStream);
      }
    });

    this.setupSignalingHandlers();

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signalingService.send('offer', offer);
    }
  }

  endCall(): void {
    this.signalingUnsubscribers.forEach(unsub => unsub());
    this.signalingUnsubscribers = [];

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.emit('connectionState', 'disconnected');
  }

  on(event: string, cb: WebRTCEventCallback): void {
    const cbs = this.listeners.get(event) || [];
    cbs.push(cb);
    this.listeners.set(event, cbs);
  }

  private setupSignalingHandlers(): void {
    const unsubOffer = signalingService.on('offer', (data: unknown) => {
      this.handleOffer(data as RTCSessionDescriptionInit).catch(console.error);
    });
    const unsubAnswer = signalingService.on('answer', (data: unknown) => {
      this.handleAnswer(data as RTCSessionDescriptionInit).catch(console.error);
    });
    const unsubIce = signalingService.on('ice_candidate', (data: unknown) => {
      this.handleIceCandidate(data as RTCIceCandidateInit).catch(console.error);
    });
    this.signalingUnsubscribers = [unsubOffer, unsubAnswer, unsubIce];
  }

  private createPeerConnection(): RTCPeerConnection {
    const pc = new RTCPeerConnection(this.rtcConfig);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signalingService.send('ice_candidate', event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        this.emit('remoteStream', remoteStream);
      }
    };

    pc.onconnectionstatechange = () => {
      this.emit('connectionState', pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        pc.restartIce();
      }
    };

    return pc;
  }

  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    signalingService.send('answer', answer);
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      // Ignore ICE candidate errors
    }
  }

  private emit(event: string, ...args: unknown[]): void {
    const cbs = this.listeners.get(event) || [];
    cbs.forEach(cb => cb(...args));
  }
}

export const webrtcService = new WebRTCService();
