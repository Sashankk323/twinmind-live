import { GROQ_CHAT_MODEL } from '@/constants/prompts';
import { ChatMessage, Suggestion } from '@/types';

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

export async function transcribeAudio(audioBlob: Blob, apiKey: string): Promise<string> {
  if (audioBlob.size > MAX_AUDIO_BYTES) {
    console.warn('[transcribeAudio] chunk too large, skipping:', audioBlob.size, 'bytes');
    return '';
  }

  const formData = new FormData();
  formData.append('audio', audioBlob);

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'x-groq-api-key': apiKey },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Transcription failed: ${error}`);
  }

  return response.text();
}

export async function generateSuggestions(
  prompt: string,
  apiKey: string
): Promise<Suggestion[]> {
  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_CHAT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Suggestions failed: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content ?? '[]';

  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) throw new Error('Invalid suggestions format');
  return parsed as Suggestion[];
}

export async function streamChatResponse(
  messages: ChatMessage[],
  systemPrompt: string,
  apiKey: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
): Promise<void> {
  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_CHAT_MODEL,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    onError(new Error(`Chat failed: ${error}`));
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError(new Error('No response body'));
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const token = json.choices?.[0]?.delta?.content;
          if (token) onToken(token);
        } catch {
          // skip malformed chunks
        }
      }
    }
    onDone();
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  } finally {
    reader.releaseLock();
  }
}
