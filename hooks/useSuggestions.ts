'use client';

import { useState, useCallback } from 'react';
import { generateSuggestions } from '@/lib/groq';
import { SuggestionBatch } from '@/types';
import { AppSettings } from '@/types';

function getWordWindow(text: string, wordCount: number): string {
  const words = text.trim().split(/\s+/);
  return words.slice(-wordCount).join(' ');
}

export function useSuggestions(settings: AppSettings) {
  const [batches, setBatches] = useState<SuggestionBatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async (transcript: string) => {
    if (!settings.groqApiKey) {
      setError('No Groq API key configured. Open settings to add your key.');
      return;
    }
    if (!transcript.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const contextText = getWordWindow(transcript, settings.suggestionsContextWindow);
      const prompt = settings.liveSuggestionsPrompt.replace('{transcript}', contextText);
      const suggestions = await generateSuggestions(prompt, settings.groqApiKey);

      const batch: SuggestionBatch = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        suggestions,
      };

      setBatches((prev) => [batch, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [settings]);

  return { batches, isLoading, error, fetchSuggestions };
}
