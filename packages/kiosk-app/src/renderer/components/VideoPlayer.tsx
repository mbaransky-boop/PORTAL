import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  style?: React.CSSProperties;
}

export function VideoPlayer({ stream, muted = false, style }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream) {
      video.srcObject = stream;
      video.play().catch(() => { /* autoplay may be blocked */ });
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  return (
    <video ref={videoRef} muted={muted} autoPlay playsInline style={{ objectFit: 'cover', backgroundColor: '#000', ...style }} />
  );
}
