import { GROQ_TRANSCRIPTION_MODEL } from '@/constants/prompts';
import { NextRequest } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import Groq from 'groq-sdk';

export async function POST(request: NextRequest) {
  const apiKey =
    request.headers.get('x-groq-api-key') ??
    process.env.GROQ_API_KEY;

  if (!apiKey) {
    return new Response('Missing Groq API key', { status: 401 });
  }

  let incoming: FormData;
  try {
    incoming = await request.formData();
  } catch {
    return new Response('Invalid form data', { status: 400 });
  }

  const audio = incoming.get('audio');
  if (!audio || !(audio instanceof Blob)) {
    return new Response('Missing audio field', { status: 400 });
  }

  const mime = (audio.type || 'audio/webm').split(';')[0].trim();
  const ext = mime.split('/')[1] ?? 'webm';
  console.log('[transcribe] audio.type:', audio.type, '→ ext:', ext, '| size:', audio.size, 'bytes');

  const tmpPath = path.join(os.tmpdir(), `transcribe-${Date.now()}.${ext}`);
  try {
    const buffer = Buffer.from(await audio.arrayBuffer());
    fs.writeFileSync(tmpPath, buffer);

    const groq = new Groq({ apiKey });
    const result = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tmpPath),
      model: GROQ_TRANSCRIPTION_MODEL,
      response_format: 'text',
    });

    // SDK returns a string when response_format is 'text'
    const text = typeof result === 'string' ? result : (result as { text: string }).text ?? '';
    return new Response(text, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[transcribe] error:', msg);
    return new Response(`Groq transcription error: ${msg}`, { status: 500 });
  } finally {
    try { fs.unlinkSync(tmpPath); } catch { /* already gone */ }
  }
}
