import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Server-side speech-to-text endpoint. The client records audio with
 * MediaRecorder (silent, just gets the OS mic indicator) and POSTs the
 * blob here as multipart/form-data with field name "audio". We forward
 * the audio to OpenAI Whisper and return the transcribed text.
 *
 * Why this exists instead of the browser's SpeechRecognition API:
 *   SpeechRecognition makes Chrome/iOS play an audible bell on every
 *   acquire/release cycle, including each silence-triggered restart.
 *   MediaRecorder doesn't trigger any platform tone, so the user only
 *   ever hears something if WE choose to play it (we never do).
 */
export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not set on this deploy' },
      { status: 500 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'expected multipart/form-data' }, { status: 400 });
  }

  const audio = form.get('audio');
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: 'missing audio file' }, { status: 400 });
  }

  // Forward to OpenAI Whisper. The blob's MIME type from MediaRecorder is
  // usually audio/webm; Whisper accepts it.
  const upstream = new FormData();
  // Whisper wants a filename so the server-side mime sniffer behaves.
  const filename = (audio as File).name && (audio as File).name.length > 0
    ? (audio as File).name
    : 'recording.webm';
  upstream.append('file', audio, filename);
  upstream.append('model', 'whisper-1');
  upstream.append('response_format', 'text');

  let response: Response;
  try {
    response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: upstream,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `whisper request failed: ${err instanceof Error ? err.message : 'unknown'}` },
      { status: 502 },
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    return NextResponse.json(
      { error: `whisper returned ${response.status}: ${detail.slice(0, 400)}` },
      { status: 502 },
    );
  }

  // response_format=text returns the bare transcript, not JSON
  const text = (await response.text()).trim();
  return NextResponse.json({ text });
}
