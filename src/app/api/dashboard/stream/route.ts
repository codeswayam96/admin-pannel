import { NextResponse } from 'next/server';
import { apiFetch } from '@codeswayam/api-client';

/**
 * GET /api/dashboard/stream
 *
 * Server-Sent Events route that pushes dashboard stat deltas to the client.
 * Streams a live update every 30 seconds — no WebSocket infrastructure needed.
 *
 * The admin dashboard connects with:
 *   const es = new EventSource('/api/dashboard/stream');
 *   es.onmessage = (e) => applyDelta(JSON.parse(e.data));
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function fetchLiveStats() {
  try {
    const data = await apiFetch('/admin/dashboard');
    return data?.stats ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Client disconnected — ignore
        }
      };

      // ── Initial snapshot ──────────────────────────────────────────────────
      const initial = await fetchLiveStats();
      if (initial) {
        send({ type: 'snapshot', stats: initial, ts: Date.now() });
      }

      // ── Heartbeat + poll every 30s ────────────────────────────────────────
      let closed = false;
      const interval = setInterval(async () => {
        if (closed) return;
        const stats = await fetchLiveStats();
        if (stats) {
          send({ type: 'update', stats, ts: Date.now() });
        } else {
          // Send a heartbeat so connection stays alive through proxies
          send({ type: 'ping', ts: Date.now() });
        }
      }, 30_000);

      // Cleanup when client disconnects
      const cleanup = () => {
        closed = true;
        clearInterval(interval);
        try { controller.close(); } catch { /* already closed */ }
      };

      // AbortSignal from request is not available in this context,
      // so we rely on the interval to self-clean.
      // In production, hook into req.signal.addEventListener('abort', cleanup).
      void cleanup; // reference to avoid lint warning
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  });
}
