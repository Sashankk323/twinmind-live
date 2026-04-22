'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Transcript from '@/components/Transcript';
import Suggestions from '@/components/Suggestions';
import Chat from '@/components/Chat';
import Settings from '@/components/Settings';
import ExportButton from '@/components/ExportButton';
import { useMicRecorder } from '@/hooks/useMicRecorder';
import { useSuggestions } from '@/hooks/useSuggestions';
import { AppSettings, ChatMessage, ExportData, Suggestion } from '@/types';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '@/constants/prompts';
import { transcribeAudio, streamChatResponse } from '@/lib/groq';

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function getWordWindow(text: string, wordCount: number): string {
  const words = text.trim().split(/\s+/);
  return words.slice(-wordCount).join(' ');
}

export default function Home() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const transcriptRef = useRef('');
  const chatMessagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  const handleAudioChunk = useCallback(
    async (blob: Blob) => {
      if (!settings.groqApiKey) {
        setTranscriptError('No Groq API key. Open settings to configure.');
        return;
      }
      setIsTranscribing(true);
      setTranscriptError(null);
      try {
        const text = await transcribeAudio(blob, settings.groqApiKey);
        if (text.trim()) {
          setTranscript((prev) => (prev ? prev + ' ' + text.trim() : text.trim()));
        }
      } catch (err) {
        setTranscriptError(err instanceof Error ? err.message : 'Transcription failed');
      } finally {
        setIsTranscribing(false);
      }
    },
    [settings.groqApiKey]
  );

  const handleMicError = useCallback((err: Error) => {
    setTranscriptError(err.message);
  }, []);

  const { isRecording, start, stop } = useMicRecorder({
    onChunk: handleAudioChunk,
    onError: handleMicError,
  });

  const { batches, isLoading: suggestionsLoading, error: suggestionsError, fetchSuggestions } =
    useSuggestions(settings);

  const prevTranscriptRef = useRef('');
  useEffect(() => {
    if (transcript && transcript !== prevTranscriptRef.current) {
      prevTranscriptRef.current = transcript;
      fetchSuggestions(transcript);
    }
  }, [transcript, fetchSuggestions]);

  const handleRefresh = useCallback(() => {
    if (transcriptRef.current) fetchSuggestions(transcriptRef.current);
  }, [fetchSuggestions]);

  const sendChatMessage = useCallback(
    async (content: string) => {
      if (!settings.groqApiKey) {
        setChatError('No Groq API key. Open settings to configure.');
        return;
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };

      const assistantId = crypto.randomUUID();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);
      setChatError(null);

      const contextTranscript = getWordWindow(transcriptRef.current, settings.chatContextWindow);
      const systemPrompt = settings.chatPrompt.replace('{transcript}', contextTranscript);
      const historyForApi = [...chatMessagesRef.current, userMsg];

      await streamChatResponse(
        historyForApi,
        systemPrompt,
        settings.groqApiKey,
        (token) => {
          setChatMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + token } : m))
          );
        },
        () => setIsStreaming(false),
        (err) => {
          setChatError(err.message);
          setIsStreaming(false);
        }
      );
    },
    [settings]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: Suggestion) => {
      sendChatMessage(suggestion.preview);
    },
    [sendChatMessage]
  );

  const getExportData = useCallback((): ExportData => {
    return {
      exportedAt: new Date().toISOString(),
      transcript,
      suggestionBatches: batches,
      chatHistory: chatMessages,
    };
  }, [transcript, batches, chatMessages]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900">TwinMind</span>
          <span className="text-sm text-gray-400 font-medium">Live Suggestions</span>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton getData={getExportData} />
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
            aria-label="Settings"
          >
            <GearIcon />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden divide-x divide-gray-200">
        <div className="flex flex-col w-1/3 min-w-0 bg-white overflow-hidden">
          <Transcript
            transcript={transcript}
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            error={transcriptError}
            onStart={start}
            onStop={stop}
          />
        </div>

        <div className="flex flex-col w-1/3 min-w-0 bg-white overflow-hidden">
          <Suggestions
            batches={batches}
            isLoading={suggestionsLoading}
            error={suggestionsError}
            onRefresh={handleRefresh}
            onCardClick={handleSuggestionClick}
          />
        </div>

        <div className="flex flex-col w-1/3 min-w-0 bg-white overflow-hidden">
          <Chat
            messages={chatMessages}
            isStreaming={isStreaming}
            error={chatError}
            onSend={sendChatMessage}
          />
        </div>
      </div>

      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={setSettings}
        currentSettings={settings}
      />
    </div>
  );
}

function GearIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
