export type SuggestionType = 'question' | 'talking_point' | 'fact_check' | 'clarification' | 'answer';

export interface Suggestion {
  type: SuggestionType;
  preview: string;
  detail_prompt: string;
}

export interface SuggestionBatch {
  id: string;
  timestamp: string;
  suggestions: Suggestion[];
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
}

export interface AppSettings {
  groqApiKey: string;
  liveSuggestionsPrompt: string;
  detailedAnswerPrompt: string;
  chatPrompt: string;
  suggestionsContextWindow: number;
  chatContextWindow: number;
}

export interface ExportData {
  exportedAt: string;
  transcript: string;
  suggestionBatches: SuggestionBatch[];
  chatHistory: ChatMessage[];
}
