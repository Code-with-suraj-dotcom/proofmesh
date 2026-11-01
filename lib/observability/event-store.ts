import crypto from 'crypto';
import { repository } from '@/database/store';
import { ResearchEvent } from '@/types/research';

class EventStore {
  private sequenceCounters: Map<string, number> = new Map();
  private processedEventIds: Set<string> = new Set();

  /**
   * Get the next sequence number for a research session
   */
  private getNextSequence(researchId: string): number {
    const current = this.sequenceCounters.get(researchId) || 0;
    const next = current + 1;
    this.sequenceCounters.set(researchId, next);
    return next;
  }

  /**
   * Append and persist a research event with sequence numbering
   */
  async appendEvent(eventData: Omit<ResearchEvent, 'id' | 'created_at'> & { id?: string }): Promise<ResearchEvent> {
    const eventId = eventData.id || crypto.randomUUID();

    // Idempotency check: don't double-persist identical event ID
    if (this.processedEventIds.has(eventId)) {
      const existing = await this.getEvents(eventData.research_id);
      const found = existing.find((e) => e.id === eventId);
      if (found) return found;
    }

    const seq = eventData.sequence_number ?? this.getNextSequence(eventData.research_id);

    const fullEvent: ResearchEvent = {
      id: eventId,
      sequence_number: seq,
      research_id: eventData.research_id,
      event_type: eventData.event_type,
      stage: eventData.stage,
      agent_id: eventData.agent_id,
      agent_name: eventData.agent_name,
      objective_id: eventData.objective_id,
      website_task_id: eventData.website_task_id,
      source_url: eventData.source_url,
      message: eventData.message,
      metadata: eventData.metadata,
      structured_metadata: eventData.structured_metadata || eventData.metadata,
      created_at: new Date().toISOString(),
    };

    this.processedEventIds.add(eventId);

    // Save to persistent repository
    try {
      await repository.addEvent(fullEvent);
    } catch (err) {
      console.error(`[EventStore] Failed to persist event ${eventId}:`, err);
    }

    return fullEvent;
  }

  /**
   * Get all persisted events for a research session in chronological sequence
   */
  async getEvents(researchId: string, sinceSequence = 0): Promise<ResearchEvent[]> {
    try {
      const events = await repository.getEvents(researchId);
      // Synchronize in-memory sequence counter with persisted events
      if (events.length > 0) {
        const maxSeq = Math.max(...events.map((e) => e.sequence_number || 0), events.length);
        const currentCounter = this.sequenceCounters.get(researchId) || 0;
        if (maxSeq > currentCounter) {
          this.sequenceCounters.set(researchId, maxSeq);
        }
      }

      const filtered = sinceSequence > 0
        ? events.filter((e) => (e.sequence_number || 0) > sinceSequence)
        : events;

      return filtered.sort((a, b) => {
        if (a.sequence_number && b.sequence_number) {
          return a.sequence_number - b.sequence_number;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    } catch (err) {
      console.error(`[EventStore] Error fetching events for ${researchId}:`, err);
      return [];
    }
  }
}

export const eventStore = new EventStore();
