import { eventStore } from './event-store';
import { eventBus } from './event-bus';
import { ResearchEvent } from '@/types/research';

export interface CreateEventStreamOptions {
  researchId: string;
  signal?: AbortSignal;
}

export function createResearchEventStream({ researchId, signal }: CreateEventStreamOptions): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      const safeEnqueue = (str: string) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(str));
        } catch {
          isClosed = true;
        }
      };

      // 1. Replay historical events from persistent store
      try {
        const historicalEvents = await eventStore.getEvents(researchId);
        for (const evt of historicalEvents) {
          safeEnqueue(`data: ${JSON.stringify(evt)}\n\n`);
        }
      } catch (err) {
        console.error(`[EventStream] Failed to load historical events for ${researchId}:`, err);
      }

      // 2. Subscribe to live real-time events via EventBus
      const unsubscribe = eventBus.subscribe(researchId, (event: ResearchEvent) => {
        safeEnqueue(`data: ${JSON.stringify(event)}\n\n`);
      });

      // 3. Heartbeat ping every 15s to keep HTTP connection alive through proxies
      const heartbeat = setInterval(() => {
        safeEnqueue(': heartbeat\n\n');
      }, 15000);

      const cleanup = () => {
        isClosed = true;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      if (signal) {
        signal.addEventListener('abort', cleanup);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

