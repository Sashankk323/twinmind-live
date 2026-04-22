'use client';

import { useState, useEffect, useRef } from 'react';
import { AppSettings } from '@/types';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '@/constants/prompts';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
  currentSettings: AppSettings;
}

export default function Settings({ isOpen, onClose, onSave, currentSettings }: SettingsProps) {
  const [draft, setDraft] = useState<AppSettings>(currentSettings);

  useEffect(() => {
    setDraft(currentSettings);
  }, [currentSettings, isOpen]);

  function handleSave() {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(draft));
    onSave(draft);
    onClose();
  }

  function handleReset() {
    setDraft(DEFAULT_SETTINGS);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          <Field
            label="Groq API Key"
            type="password"
            value={draft.groqApiKey}
            onChange={(v) => setDraft({ ...draft, groqApiKey: v })}
            placeholder="gsk_..."
            hint="Your key is stored only in localStorage."
          />

          <TextareaField
            label="Live Suggestions Prompt"
            value={draft.liveSuggestionsPrompt}
            onChange={(v) => setDraft({ ...draft, liveSuggestionsPrompt: v })}
            rows={4}
          />

          <TextareaField
            label="Detailed Answer Prompt"
            value={draft.detailedAnswerPrompt}
            onChange={(v) => setDraft({ ...draft, detailedAnswerPrompt: v })}
            rows={3}
          />

          <TextareaField
            label="Chat Prompt"
            value={draft.chatPrompt}
            onChange={(v) => setDraft({ ...draft, chatPrompt: v })}
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <NumberField
              label="Suggestions Context Window (words)"
              value={draft.suggestionsContextWindow}
              onChange={(v) => setDraft({ ...draft, suggestionsContextWindow: v })}
              min={50}
              max={4000}
            />
            <NumberField
              label="Chat Context Window (words)"
              value={draft.chatContextWindow}
              onChange={(v) => setDraft({ ...draft, chatContextWindow: v })}
              min={50}
              max={8000}
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t">
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
          >
            Reset to defaults
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const firstLine = value.split('\n')[0] || '';
  const preview = firstLine.length > 80 ? firstLine.slice(0, 80) + '…' : firstLine;

  function handleToggle() {
    setExpanded((prev) => {
      if (!prev) {
        setTimeout(() => textareaRef.current?.focus(), 0);
      }
      return !prev;
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <button
          type="button"
          onClick={handleToggle}
          className="shrink-0 text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          {expanded ? 'Hide' : 'Show / Edit'}
        </button>
      </div>
      {!expanded && (
        <p className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg bg-gray-50 truncate">
          {preview || <span className="italic text-gray-400">empty</span>}
        </p>
      )}
      {expanded && (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 resize-y"
        />
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
    </div>
  );
}

function XIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
