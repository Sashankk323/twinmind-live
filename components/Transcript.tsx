'use client';

import { useEffect, useRef } from 'react';

interface TranscriptProps {
  transcript: string;
  isRecording: boolean;
  isTranscribing: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
}

export default function Transcript({
  transcript,
  isRecording,
  isTranscribing,
  error,
  onStart,
  onStop,
}: TranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-800">Transcript</h2>
          {isRecording && (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Live
            </span>
          )}
          {isTranscribing && (
            <span className="text-xs text-gray-400 animate-pulse">transcribing…</span>
          )}
        </div>
        <button
          onClick={isRecording ? onStop : onStart}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-md'
              : 'bg-gray-900 hover:bg-gray-700 text-white'
          }`}
        >
          {isRecording ? (
            <>
              <span className="w-2.5 h-2.5 bg-white rounded-sm" />
              Stop
            </>
          ) : (
            <>
              <MicIcon />
              Start
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {transcript ? (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{transcript}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">
            {isRecording ? 'Listening…' : 'Press Start to begin recording.'}
          </p>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z"
      />
    </svg>
  );
}
