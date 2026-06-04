/**
 * Client helper for the streaming G.ai chat endpoint.
 *
 * POST /api/copilot/chat returns newline-delimited JSON (NDJSON). Each line is
 * one event:
 *   { "t": "token",  "v": "..." }              — answer text delta
 *   { "t": "status", "v": "Searching…" }        — transient tool status
 *   { "t": "meta",   "response": { ... } }      — structured payload (once)
 *   { "t": "done" }                             — stream complete
 *   { "t": "error",  "v": "..." }               — server-side failure
 *
 * `streamCopilotChat` runs the request, dispatches callbacks for live UI
 * updates, and resolves with the final accumulated answer + structured
 * response. Non-OK HTTP responses (e.g. 429 rate limit) are returned as
 * { ok: false } with the server's error message — they are NOT streams.
 */

import type { CopilotChatResponse } from '@/types/copilot';

export interface ChatStreamPathContext {
  pathId: string;
  pathTitle: string;
  moduleId?: string;
  moduleTitle?: string;
  currentConcept?: string;
}

export interface ChatStreamRequest {
  /** Firebase ID token. */
  token: string;
  message: string;
  mode: 'suggest' | 'assist';
  /** User's local date (YYYY-MM-DD) for correct scheduling. */
  clientDateISO?: string;
  pathContext?: ChatStreamPathContext;
}

export interface ChatStreamCallbacks {
  /** A chunk of the answer text arrived. */
  onToken?: (delta: string) => void;
  /** A tool started running. */
  onStatus?: (status: string) => void;
  /** The structured payload (actions, suggestions, autonomy) arrived. */
  onMeta?: (response: CopilotChatResponse) => void;
}

export interface ChatStreamResult {
  ok: boolean;
  status: number;
  /** Full assistant answer — authoritative copy from `meta`, else accumulated. */
  answer: string;
  /** Structured payload. Present on success. */
  response?: CopilotChatResponse;
  /** Set when ok is false. */
  error?: string;
}

interface StreamEvent {
  t: string;
  v?: string;
  response?: CopilotChatResponse;
}

export async function streamCopilotChat(
  req: ChatStreamRequest,
  callbacks: ChatStreamCallbacks = {}
): Promise<ChatStreamResult> {
  let res: Response;
  try {
    res = await fetch('/api/copilot/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${req.token}` },
      body: JSON.stringify({
        message: req.message,
        mode: req.mode,
        clientDateISO: req.clientDateISO,
        pathContext: req.pathContext,
      }),
    });
  } catch {
    return { ok: false, status: 0, answer: '', error: 'G.ai is unreachable right now. Try again.' };
  }

  if (!res.ok || !res.body) {
    let error = 'G.ai is unreachable right now. Try again.';
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) error = body.error;
    } catch {
      /* keep the default message */
    }
    return { ok: false, status: res.status, answer: '', error };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let answer = '';
  let response: CopilotChatResponse | undefined;
  let streamError: string | undefined;

  const handleLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let evt: StreamEvent;
    try {
      evt = JSON.parse(trimmed) as StreamEvent;
    } catch {
      return; // ignore a malformed/partial line
    }
    if (evt.t === 'token' && typeof evt.v === 'string') {
      answer += evt.v;
      callbacks.onToken?.(evt.v);
    } else if (evt.t === 'status' && typeof evt.v === 'string') {
      callbacks.onStatus?.(evt.v);
    } else if (evt.t === 'meta' && evt.response) {
      response = evt.response;
      callbacks.onMeta?.(evt.response);
    } else if (evt.t === 'error') {
      streamError = evt.v || 'Something went wrong.';
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        handleLine(buffer.slice(0, nl));
        buffer = buffer.slice(nl + 1);
      }
    }
    if (buffer) handleLine(buffer);
  } catch {
    if (!streamError && !answer) {
      return { ok: false, status: res.status, answer: '', error: 'The connection dropped. Try again.' };
    }
  }

  if (streamError) {
    return { ok: false, status: res.status, answer, response, error: streamError };
  }
  return { ok: true, status: res.status, answer: response?.answer || answer, response };
}
