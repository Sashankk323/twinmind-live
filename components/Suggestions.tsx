'use client';

import { SuggestionBatch, Suggestion } from '@/types';
import { BADGE_COLORS, BADGE_LABELS } from '@/constants/prompts';

interface SuggestionsProps {
  batches: SuggestionBatch[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onCardClick: (suggestion: Suggestion) => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function Suggestions({
  batches,
  isLoading,
  error,
  onRefresh,
  onCardClick,
}: SuggestionsProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800">Live Suggestions</h2>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshIcon spinning={isLoading} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {isLoading && batches.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        )}

        {batches.length === 0 && !isLoading && (
          <p className="text-sm text-gray-400 italic">
            Suggestions appear automatically after each transcript chunk.
          </p>
        )}

        {batches.map((batch) => (
          <div key={batch.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 whitespace-nowrap">{formatTime(batch.timestamp)}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            {batch.suggestions.map((suggestion, idx) => (
              <SuggestionCard
                key={idx}
                suggestion={suggestion}
                onClick={() => onCardClick(suggestion)}
              />
            ))}
          </div>
        ))}

        {isLoading && batches.length > 0 && (
          <div className="flex justify-center py-2">
            <span className="text-xs text-gray-400 animate-pulse">Generating…</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion, onClick }: { suggestion: Suggestion; onClick: () => void }) {
  const badgeClass = BADGE_COLORS[suggestion.type] ?? 'bg-gray-100 text-gray-600';
  const badgeLabel = BADGE_LABELS[suggestion.type] ?? suggestion.type;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
    >
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${badgeClass}`}>
          {badgeLabel}
        </span>
        <p className="text-sm text-gray-700 leading-snug group-hover:text-gray-900">
          {suggestion.preview}
        </p>
      </div>
    </button>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}
