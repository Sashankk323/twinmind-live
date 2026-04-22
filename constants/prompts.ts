export const DEFAULT_LIVE_SUGGESTIONS_PROMPT = `You are a real-time meeting assistant. Based on the transcript below, generate exactly 3 suggestions to help the listener right now. Choose the most useful mix from: question (worth asking), talking_point (worth raising), fact_check (claim to verify), clarification (needs more explanation), answer (to a question just asked). Preview must be useful on its own in 1-2 sentences. Be specific not generic. No repeats from earlier context. Every suggestion preview must reference specific words, names, or claims from the transcript. Never write generic titles. Bad example: 'Understanding the shift in topic'. Good example: 'The jump from earthquakes to fried chicken suggests the conversation lost focus — worth steering back?' Respond ONLY with a valid JSON array, no markdown, no explanation: [{"type":"...","preview":"...","detail_prompt":"..."}]. Recent transcript: {transcript}`;

export const DEFAULT_DETAILED_ANSWER_PROMPT = `You are a knowledgeable meeting assistant. A user clicked this suggestion during a live conversation: {suggestion}. Full transcript: {transcript}. Give a thorough useful answer in 3-6 sentences. Be direct and specific. No filler.`;

export const DEFAULT_CHAT_PROMPT = `You are a smart meeting assistant with full context of the ongoing conversation. Answer clearly and concisely based on the transcript. If the answer isn't in the transcript, use your own knowledge but say so. Transcript: {transcript}`;

export const DEFAULT_SETTINGS = {
  groqApiKey: '',
  liveSuggestionsPrompt: DEFAULT_LIVE_SUGGESTIONS_PROMPT,
  detailedAnswerPrompt: DEFAULT_DETAILED_ANSWER_PROMPT,
  chatPrompt: DEFAULT_CHAT_PROMPT,
  suggestionsContextWindow: 500,
  chatContextWindow: 1000,
};

export const SETTINGS_STORAGE_KEY = 'twinmind_settings';

export const GROQ_TRANSCRIPTION_MODEL = 'whisper-large-v3';
export const GROQ_CHAT_MODEL = 'llama-3.3-70b-versatile';

export const BADGE_COLORS: Record<string, string> = {
  question: 'bg-blue-100 text-blue-700',
  talking_point: 'bg-purple-100 text-purple-700',
  fact_check: 'bg-yellow-100 text-yellow-700',
  clarification: 'bg-orange-100 text-orange-700',
  answer: 'bg-green-100 text-green-700',
};

export const BADGE_LABELS: Record<string, string> = {
  question: 'Question',
  talking_point: 'Talking Point',
  fact_check: 'Fact Check',
  clarification: 'Clarification',
  answer: 'Answer',
};
