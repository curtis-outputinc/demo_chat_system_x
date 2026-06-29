'use client';

import { useState, useRef, useEffect, useMemo, type ReactNode, type CSSProperties } from 'react';
import type { PublicVerticalConfig } from '@/lib/vertical';
import { lighten } from '@/lib/color';

// Local copy of the chat mode union. Kept local (not imported from
// lib/system-prompt) so the client bundle never pulls in server-only fs code.
type Mode = 'client' | 'professional' | null;

export interface ChatProps {
  /** The active vertical's public config (brand, modes, links, booking URL). */
  config: PublicVerticalConfig;
  /**
   * When true, renders without the header/branding chrome — for embed iframes
   * where the host page provides its own framing.
   */
  embedMode?: boolean;
  /**
   * Visual theme for the chat surface. "dark" (default) keeps the original
   * black-background look; "light" renders dark text on a light panel. Embeds
   * are always dark. Drives a set of CSS custom properties on the root.
   */
  theme?: 'light' | 'dark';
  /**
   * Override the resolved page path. Used when the chatbot is embedded inside
   * an iframe and the host page passes its location via postMessage or query string.
   */
  pageContextOverride?: string | null;
  /** Override the ref param. Same use case as pageContextOverride. */
  refParamOverride?: string | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

// Builds a URL matcher + label resolver from the vertical config. The chatbot
// is instructed to only emit URLs from config.approvedLinks plus the booking
// URL; this renders those as clickable accent links with friendly labels.
function buildLinkTools(config: PublicVerticalConfig) {
  const bookingHost = hostOf(config.bookingUrl);
  const linkLabels = new Map<string, string>();
  for (const l of config.approvedLinks) {
    linkLabels.set(l.url.replace(/\/$/, ''), l.label);
  }

  const hosts = new Set<string>();
  if (bookingHost) hosts.add(bookingHost);
  for (const l of config.approvedLinks) {
    const h = hostOf(l.url);
    if (h) hosts.add(h);
  }

  const hostAlternation = [...hosts].map(escapeRegex).join('|');
  const linkRegex = hostAlternation
    ? new RegExp(`https?:\\/\\/(?:${hostAlternation})(?:\\/[^\\s)>,.;!?]*)?`, 'g')
    : null;

  function labelForUrl(url: string): string {
    if (bookingHost && url.includes(bookingHost)) return 'book a meeting';
    const trimmed = url.replace(/\/$/, '');
    return linkLabels.get(trimmed) ?? url;
  }

  return { linkRegex, labelForUrl };
}

// Voice-input dedup helpers. Mobile Chrome's continuous-mode speech
// recognition can emit the same word several times in a row, and the rapid
// restart cycle can re-transcribe audio that the previous session already
// finalized. Both fall away with these two passes.

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

// Merge a single recognition-result transcript into the accumulator.
// If `chunk` starts with what we already have, the engine is in cumulative
// mode (each new final restates everything) and we replace. Otherwise it's
// incremental (this chunk is a new utterance) and we append with a space.
function mergeChunk(accumulator: string, chunk: string): string {
  if (!chunk) return accumulator;
  if (!accumulator) return chunk;
  const accLower = accumulator.trim().toLowerCase();
  const chunkLower = chunk.trim().toLowerCase();
  if (accLower && chunkLower.startsWith(accLower)) {
    return chunk;
  }
  return accumulator.replace(/\s+$/, '') + ' ' + chunk.replace(/^\s+/, '');
}

// Within a single session: drop a final word if it's an exact repeat of the
// previous final word. Conservative — only collapses immediate repeats.
function collapseConsecutive(text: string): string {
  if (!text) return text;
  const tokens = text.split(/(\s+)/);
  const out: string[] = [];
  let lastNorm = '';
  for (const tok of tokens) {
    if (!tok.trim()) {
      out.push(tok);
      continue;
    }
    const norm = normalizeWord(tok);
    if (norm && norm === lastNorm) continue;
    out.push(tok);
    lastNorm = norm;
  }
  return out.join('');
}

// Across sessions: when joining `addition` onto `existing`, strip the leading
// words of `addition` that already sit at the tail of `existing`. Caps the
// overlap window at 12 words so it stays cheap and doesn't over-merge.
function appendNoOverlap(existing: string, addition: string): string {
  const trimmedAdd = addition.trim();
  if (!trimmedAdd) return existing;
  const existingWords = existing.trim().split(/\s+/).filter(Boolean);
  const additionWords = trimmedAdd.split(/\s+/).filter(Boolean);
  const maxK = Math.min(existingWords.length, additionWords.length, 12);
  let overlap = 0;
  for (let k = maxK; k > 0; k--) {
    let match = true;
    for (let i = 0; i < k; i++) {
      const a = normalizeWord(existingWords[existingWords.length - k + i]);
      const b = normalizeWord(additionWords[i]);
      if (!a || a !== b) {
        match = false;
        break;
      }
    }
    if (match) {
      overlap = k;
      break;
    }
  }
  const newWords = additionWords.slice(overlap);
  if (newWords.length === 0) return existing;
  const sep = existing && !/\s$/.test(existing) ? ' ' : '';
  return existing + sep + newWords.join(' ');
}

// Live display while a session is in progress. `interim` doesn't get the
// dedup treatment — it's already a fresh partial from the current session.
function composeDisplay(committed: string, sessionFinals: string, interim: string): string {
  const merged = appendNoOverlap(committed, sessionFinals);
  if (!interim.trim()) return merged;
  const sep = merged && !/\s$/.test(merged) ? ' ' : '';
  return merged + sep + interim.trim();
}

// Theme tokens. The dark values reproduce the original look exactly; the light
// values render dark text on a light panel with a legible accent for links.
function themeVars(theme: 'light' | 'dark', accent: string): CSSProperties {
  if (theme === 'light') {
    return {
      '--accent': accent,
      '--btn': lighten(accent, 0.4),
      '--accent-ink': '#0a9d8b',
      '--accent-soft': 'rgba(7, 228, 198, 0.10)',
      '--on-accent': '#000000',
      '--btn-fg': '#000000',
      '--btn-border': 'transparent',
      '--fg': '#0a0a0a',
      '--fg-muted': '#0a0a0a',
      '--fg-faint': 'rgba(10, 10, 10, 0.75)',
      '--border': 'rgba(10, 10, 10, 0.12)',
      '--border-strong': 'rgba(10, 10, 10, 0.22)',
      '--panel': '#ffffff',
      '--bubble-bg': 'rgba(7, 228, 198, 0.12)',
      '--bubble-border': 'rgba(10, 157, 139, 0.40)',
      '--field-bg': '#ffffff',
      '--link': '#2563eb',
    } as CSSProperties;
  }
  return {
    '--accent': accent,
    '--btn': '#000000',
    '--accent-ink': accent,
    '--accent-soft': 'rgba(26, 224, 203, 0.05)',
    '--on-accent': '#000000',
    '--btn-fg': accent,
    '--btn-border': accent,
    '--fg': '#ffffff',
    '--fg-muted': '#ffffff',
    '--fg-faint': 'rgba(255, 255, 255, 0.7)',
    '--border': 'rgba(255, 255, 255, 0.10)',
    '--border-strong': 'rgba(255, 255, 255, 0.20)',
    '--panel': '#000000',
    '--bubble-bg': 'rgba(26, 224, 203, 0.10)',
    '--bubble-border': 'rgba(26, 224, 203, 0.30)',
    '--field-bg': 'rgba(26, 224, 203, 0.05)',
    '--link': '#60a5fa',
  } as CSSProperties;
}

export default function Chat({
  config,
  embedMode = false,
  theme = 'dark',
  pageContextOverride,
  refParamOverride,
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  // Narrow-viewport detection for swapping the input placeholder + send-button
  // text to shorter mobile equivalents. matchMedia stays in sync as the user
  // resizes / rotates.
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 640px)');
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  const lastUserMessageRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  // Stays true between user mic-toggle clicks. onend uses it to decide
  // whether to auto-restart after Chromium ends the session (which it does
  // every few seconds on silence, even with continuous=true).
  const keepListeningRef = useRef(false);
  // Holds finalized transcript from prior auto-restart sessions so the
  // visible input survives restarts.
  const finalTranscriptRef = useRef('');
  // Holds an explicit getUserMedia audio stream while the mic is on, so the
  // OS keeps the mic "in use" across SpeechRecognition restarts. This is what
  // suppresses Chrome's built-in acquire / release chimes. Stopped on toggle-off.
  const micStreamRef = useRef<MediaStream | null>(null);

  const { linkRegex, labelForUrl } = useMemo(() => buildLinkTools(config), [config]);

  // Embeds are always dark; otherwise honor the theme prop.
  const effectiveTheme: 'light' | 'dark' = embedMode ? 'dark' : theme;
  const themeStyle = useMemo(
    () => themeVars(effectiveTheme, config.accentColor),
    [effectiveTheme, config.accentColor],
  );

  const { refParam, pagePath } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { refParam: null, pagePath: null };
    }
    const params = new URLSearchParams(window.location.search);
    const ref = refParamOverride ?? params.get('ref');
    const path = pageContextOverride ?? window.location.pathname;
    return { refParam: ref, pagePath: path };
  }, [pageContextOverride, refParamOverride]);

  // Replace every recognized URL in an assistant message with a clickable accent
  // link. Returns strings + anchor elements React renders inline.
  function renderAssistantContent(content: string): ReactNode[] {
    if (!linkRegex) return [content];
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    let key = 0;
    linkRegex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      parts.push(
        <a
          key={`link-${key++}`}
          href={match[0]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[color:var(--link)] underline"
        >
          {labelForUrl(match[0])}
        </a>,
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }
    return parts.length > 0 ? parts : [content];
  }

  const lastUserIndex = messages.findLastIndex((m) => m.role === 'user');

  useEffect(() => {
    // Anchor the most recent user question to the top of the chat viewport.
    lastUserMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [lastUserIndex]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    setSpeechSupported(!!SR);

    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        // ignore
      }
      try {
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      } catch {
        // ignore
      }
    };
  }, []);

  // Builds a fresh SpeechRecognition with continuous=true + an onend auto-restart
  // loop so the mic stays on across natural pauses until the user taps it off
  // (or hits send).
  //
  // Result handling has to deal with two browser dialects:
  //   - Incremental (most desktop Chrome): each entry in event.results is a
  //     distinct utterance, and the right move is to concatenate them.
  //   - Cumulative (some mobile Chrome / Safari builds): each new final entry
  //     contains the ENTIRE session transcript so far, growing every event.
  //     Concatenating these produces "okayokay sookay so I..." explosions.
  //
  // The resolver rebuilds finals from scratch per event: when the next final
  // starts with the prior accumulator, treat it as cumulative (replace),
  // otherwise treat it as incremental (append). collapseConsecutive and
  // appendNoOverlap remain as belt-and-suspenders for residual duplicates.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function createRecognition(SR: any) {
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // Tracks finalized (and deduped) text from THIS session only. onend folds
    // it into finalTranscriptRef before restarting.
    let sessionFinals = '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let resolvedFinals = '';
      let resolvedInterim = '';
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        const transcript: string = r[0].transcript;
        if (r.isFinal) {
          resolvedFinals = mergeChunk(resolvedFinals, transcript);
        } else {
          resolvedInterim = mergeChunk(resolvedInterim, transcript);
        }
      }
      sessionFinals = collapseConsecutive(resolvedFinals);
      setInput(composeDisplay(finalTranscriptRef.current, sessionFinals, resolvedInterim));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      const code: string = event?.error ?? 'unknown';
      console.error('Speech recognition error:', code, event);
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        keepListeningRef.current = false;
        setMicError('Microphone access is blocked. Check your browser permissions.');
        window.setTimeout(() => setMicError(null), 6000);
      } else if (code === 'audio-capture') {
        keepListeningRef.current = false;
        setMicError('No microphone found on this device.');
        window.setTimeout(() => setMicError(null), 6000);
      } else if (code === 'network') {
        keepListeningRef.current = false;
        setMicError('Voice input network error. Check your connection and try again.');
        window.setTimeout(() => setMicError(null), 6000);
      } else if (code === 'no-speech' || code === 'aborted') {
        // Transient — let onend auto-restart, no toast.
      } else {
        // Surface anything else so browser-specific failures (e.g. Edge using
        // a different recognition backend) become diagnosable instead of silent.
        setMicError(`Voice input error: ${code}. Tap the mic to try again.`);
        window.setTimeout(() => setMicError(null), 8000);
      }
    };

    recognition.onend = () => {
      finalTranscriptRef.current = appendNoOverlap(finalTranscriptRef.current, sessionFinals);
      sessionFinals = '';
      if (keepListeningRef.current) {
        const next = createRecognition(SR);
        recognitionRef.current = next;
        try {
          next.start();
          // Mic stream is intentionally held across the restart so Chrome
          // does not play its end-of-session and start-of-session chimes.
          return;
        } catch (err) {
          console.error('Failed to restart recognition:', err);
          keepListeningRef.current = false;
          setMicError('Voice input stopped. Tap the mic to try again.');
          window.setTimeout(() => setMicError(null), 6000);
        }
      }
      // Session is fully over: release the held mic stream.
      try {
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {
        // ignore
      }
      micStreamRef.current = null;
      setIsRecording(false);
    };

    return recognition;
  }

  function releaseMicStream() {
    try {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {
      // ignore
    }
    micStreamRef.current = null;
  }

  async function toggleMic() {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;

    setMicError(null);

    if (isRecording) {
      keepListeningRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      releaseMicStream();
      setIsRecording(false);
      return;
    }

    // Acquire and hold the OS mic BEFORE starting SpeechRecognition. Chrome
    // plays its acquire / release chime only when the OS-level mic state
    // changes. By holding a getUserMedia stream open across the entire
    // recognition session (including auto-restarts), the chime never fires.
    if (!navigator?.mediaDevices?.getUserMedia) {
      setMicError('Voice input is not supported in this browser.');
      window.setTimeout(() => setMicError(null), 6000);
      return;
    }
    try {
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error('Failed to acquire microphone:', err);
      setMicError('Microphone access is blocked. Check your browser permissions.');
      window.setTimeout(() => setMicError(null), 6000);
      return;
    }

    finalTranscriptRef.current = '';
    keepListeningRef.current = true;
    const recognition = createRecognition(SR);
    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recognition:', err);
      keepListeningRef.current = false;
      releaseMicStream();
      setMicError('Could not start voice input. Try again.');
      window.setTimeout(() => setMicError(null), 6000);
    }
  }

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const fallbackContent = `I'm having trouble right now. Want to book a call directly? ${config.bookingUrl}`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          conversationId,
          pageContext: pagePath,
          refParam,
          mode,
        }),
      });

      const contentType = response.headers.get('content-type') ?? '';
      const isStream = contentType.includes('application/x-ndjson') && response.body !== null;

      if (isStream) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let assistantContent = '';
        let placeholderAdded = false;

        const updateAssistant = (text: string) => {
          assistantContent = text;
          if (!placeholderAdded) {
            placeholderAdded = true;
          }
          setMessages([...newMessages, { role: 'assistant', content: assistantContent }]);
        };

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.trim()) continue;
            let event: { type?: string; text?: string; conversationId?: string };
            try {
              event = JSON.parse(line);
            } catch {
              continue;
            }
            if (event.type === 'delta' && typeof event.text === 'string') {
              updateAssistant(assistantContent + event.text);
            } else if (event.type === 'replace' && typeof event.text === 'string') {
              updateAssistant(event.text);
            } else if (event.type === 'done') {
              if (event.conversationId) {
                setConversationId(event.conversationId);
              }
            }
          }
        }

        if (!placeholderAdded) {
          setMessages([...newMessages, { role: 'assistant', content: fallbackContent }]);
        }
      } else {
        const data = await response.json();
        const assistantContent = data.message ?? fallbackContent;
        setMessages([...newMessages, { role: 'assistant', content: assistantContent }]);

        if (data.conversationId) {
          setConversationId(data.conversationId);
        }
      }
    } catch (error) {
      console.error('chat error', error);
      setMessages([...newMessages, { role: 'assistant', content: fallbackContent }]);
    } finally {
      setIsLoading(false);
    }
  }

  const wrapperClass = embedMode
    ? 'flex flex-col h-full bg-[var(--panel)] text-[color:var(--fg)]'
    : 'flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 text-[color:var(--fg)]';

  // Mode buttons, always shown above the textbox. Let the visitor explore as a
  // client or as the business owner, and switch at any time.
  const modeButtons = (
    <div className="flex items-center gap-2 mb-3">
      {(['client', 'professional'] as const).map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => setMode(active ? null : m)}
            aria-pressed={active}
            className={
              active
                ? 'text-sm rounded-full px-4 py-1.5 bg-[var(--accent)] text-[color:var(--on-accent)] font-medium transition'
                : 'text-sm rounded-full px-4 py-1.5 border border-[color:var(--border-strong)] text-[color:var(--fg-muted)] hover:border-[color:var(--accent)] transition'
            }
          >
            {config.modes[m].label}
          </button>
        );
      })}
    </div>
  );

  const inputForm = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        sendMessage(input);
      }}
      className="flex flex-row gap-2"
    >
      <div className="relative flex-1 min-w-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder={embedMode ? 'Ask anything...' : 'How can I help you'}
          className={`w-full bg-[var(--field-bg)] border-[3px] border-[color:var(--accent)] rounded-lg py-3 text-base text-[color:var(--fg)] placeholder:text-[color:var(--fg-faint)] focus:outline-none focus:border-[color:var(--accent)] disabled:opacity-50 ${
            speechSupported ? 'pl-4 pr-12' : 'px-4'
          }`}
        />
        {speechSupported && (
          <button
            type="button"
            onClick={toggleMic}
            disabled={isLoading}
            aria-label={isRecording ? 'Stop voice input' : 'Start voice input'}
            aria-pressed={isRecording}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition disabled:opacity-50 ${
              isRecording
                ? 'text-red-400 bg-red-400/15 animate-pulse'
                : 'text-[color:var(--accent-ink)] hover:bg-[var(--accent-soft)]'
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        aria-label="Send message"
        className="shrink-0 bg-[var(--btn)] text-[color:var(--btn-fg)] border-[3px] border-[color:var(--btn-border)] font-medium px-3 sm:px-5 py-3 rounded-lg hover:opacity-90 disabled:opacity-30 transition flex items-center justify-center"
      >
        <svg
          className="sm:hidden"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
        <span className="hidden sm:inline">Send</span>
      </button>
    </form>
  );

  const micErrorEl = micError ? (
    <p className="text-xs text-red-400 mt-2 text-center" role="status">
      {micError}
    </p>
  ) : null;

  const bookButton = (
    <div className="mt-10 sm:mt-3">
      <a
        href={config.bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-lg border border-[color:var(--accent)] text-[color:var(--accent-ink)] font-medium px-4 py-2 text-sm hover:bg-[var(--accent-soft)] transition"
      >
        Book an Appointment
      </a>
    </div>
  );

  const disclaimerBlock = config.disclaimer ? (
    <div className="mt-5 space-y-3 text-xs leading-relaxed text-[color:var(--fg-faint)]">
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 cursor-pointer shrink-0"
          style={{ accentColor: 'var(--accent)' }}
        />
        <span>{config.disclaimer.checkbox}</span>
      </label>
      {config.disclaimer.footer ? <p>{config.disclaimer.footer}</p> : null}
    </div>
  ) : null;

  // Empty-state choices: a short description above each mode button.
  const modeChoices = (
    <div className="grid grid-cols-2 gap-3 mb-5">
      {(['client', 'professional'] as const).map((m) => {
        const active = mode === m;
        return (
          <div key={m} className="flex flex-col items-center text-center gap-2">
            <div className="min-h-[2.75rem] flex items-center justify-center">
              <p className="text-xs text-[color:var(--fg-muted)] leading-snug text-balance">
                {config.modes[m].blurb}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMode(active ? null : m)}
              aria-pressed={active}
              className={
                active
                  ? 'whitespace-nowrap text-sm rounded-full px-5 py-2 bg-[var(--accent)] text-[color:var(--on-accent)] font-medium transition'
                  : 'whitespace-nowrap text-sm rounded-full px-5 py-2 border border-[color:var(--border-strong)] text-[color:var(--fg-muted)] hover:border-[color:var(--accent)] transition'
              }
            >
              {config.modes[m].label}
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={wrapperClass} style={themeStyle}>
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col justify-start md:justify-center px-4 pt-4 pb-6 md:py-6">
          <div className="w-full max-w-xl mx-auto">
            {modeChoices}
            {inputForm}
            {micErrorEl}
            {bookButton}
            {disclaimerBlock}
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-6 mb-6 overflow-y-auto px-4 py-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                ref={i === lastUserIndex ? lastUserMessageRef : null}
                className={msg.role === 'user' ? 'flex justify-end' : ''}
              >
                <div
                  className={
                    msg.role === 'user'
                      ? 'bg-[var(--bubble-bg)] border border-[color:var(--bubble-border)] rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]'
                      : 'text-[color:var(--fg)] leading-relaxed whitespace-pre-wrap'
                  }
                >
                  {msg.role === 'assistant' ? renderAssistantContent(msg.content) : msg.content}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="text-[color:var(--fg-faint)] text-sm flex items-center gap-2">
                <span className="inline-block h-2 w-2 bg-[var(--accent)] rounded-full animate-pulse" />
                thinking
              </div>
            )}
          </div>
          <div className="sticky bottom-0 bg-[var(--panel)] pt-3 px-4 pb-4 border-t border-[color:var(--border)]">
            {modeButtons}
            {inputForm}
            {micErrorEl}
            {bookButton}
          </div>
        </>
      )}
    </div>
  );
}
