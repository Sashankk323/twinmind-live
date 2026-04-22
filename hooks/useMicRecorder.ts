'use client';

import { useRef, useState, useCallback } from 'react';

interface UseMicRecorderOptions {
  chunkIntervalMs?: number;
  onChunk: (blob: Blob) => void;
  onError: (err: Error) => void;
}

export function useMicRecorder({ chunkIntervalMs = 30000, onChunk, onError }: UseMicRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');

  const flushChunk = useCallback(() => {
    if (chunksRef.current.length === 0) return;
    const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
    chunksRef.current = [];
    onChunk(blob);
  }, [onChunk]);

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

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onerror = () => {
        onError(new Error('MediaRecorder error'));
      };

      recorder.start(1000);
      setIsRecording(true);

      intervalRef.current = setInterval(flushChunk, chunkIntervalMs);
    } catch (err) {
      onError(err instanceof Error ? err : new Error('Microphone access denied'));
    }
  }, [chunkIntervalMs, flushChunk, onError]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    flushChunk();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  }, [flushChunk]);

  return { isRecording, start, stop };
}
