'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@/types';

interface ChatProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  onSend: (content: string) => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Chat({ messages, isStreaming, error, onSend }: ChatProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    onSend(text);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800">Chat</h2>
      </div>

      {error && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 italic">
            Ask anything about the meeting, or click a suggestion to get started.
          </p>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isStreaming && (
          <div className="flex gap-1 px-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the meeting…"
            disabled={isStreaming}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex flex-col gap-0.5 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[90%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        {message.content}
      </div>
      <span className="text-xs text-gray-400 px-1">{formatTime(message.timestamp)}</span>
    </div>
  );
}
