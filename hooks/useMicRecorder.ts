'use client';

import { useRef, useState, useCallback } from 'react';

interface UseMicRecorderOptions {
  chunkIntervalMs?: number;
  onChunk: (blob: Blob) => void;
  onError: (err: Error) => void;
}

export function useMicRecorder({ chunkIntervalMs = 15000, onChunk, onError }: UseMicRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');
  const activeRef = useRef(false);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      console.log('[useMicRecorder] using mimeType:', mimeType);
      mimeTypeRef.current = mimeType;
      activeRef.current = true;
      setIsRecording(true);

      const startChunk = () => {
        if (!activeRef.current) return;

        const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 16000 });
        mediaRecorderRef.current = recorder;
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          if (chunks.length > 0) {
            onChunk(new Blob(chunks, { type: mimeTypeRef.current }));
          }
          if (activeRef.current) startChunk();
        };

        recorder.onerror = () => {
          onError(new Error('MediaRecorder error'));
        };

        recorder.start();
        setTimeout(() => {
          if (recorder.state !== 'inactive') recorder.stop();
        }, chunkIntervalMs);
      };

      startChunk();
    } catch (err) {
      onError(err instanceof Error ? err : new Error('Microphone access denied'));
    }
  }, [chunkIntervalMs, onChunk, onError]);

  const stop = useCallback(() => {
    activeRef.current = false;
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  return { isRecording, start, stop };
}
