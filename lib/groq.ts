import { GROQ_CHAT_MODEL, GROQ_TRANSCRIPTION_MODEL } from '@/constants/prompts';
import { ChatMessage, Suggestion } from '@/types';

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';

export async function transcribeAudio(audioBlob: Blob, apiKey: string): Promise<string> {
  const sendFile = async (file: File): Promise<Response> => {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('model', GROQ_TRANSCRIPTION_MODEL);
    formData.append('response_format', 'text');
    return fetch(`${GROQ_API_BASE}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });
  };

  const webmFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
  console.log('[transcribeAudio] original blob type:', audioBlob.type, '→ trying recording.webm');

  let response = await sendFile(webmFile);
  console.log('[transcribeAudio] webm status:', response.status);

  if (!response.ok) {
    const webmError = await response.text();
    console.error('[transcribeAudio] webm failed:', response.status, webmError);

    const mp4File = new File([audioBlob], 'recording.mp4', { type: 'audio/mp4' });
    console.log('[transcribeAudio] retrying as recording.mp4');
    response = await sendFile(mp4File);
    console.log('[transcribeAudio] mp4 status:', response.status);

    if (!response.ok) {
      const mp4Error = await response.text();
      console.error('[transcribeAudio] mp4 also failed:', response.status, mp4Error);
      throw new Error(`Transcription failed: ${mp4Error}`);
    }
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
