import { ResearchEvent } from '@/types/research';

export type EventSubscriber = (event: ResearchEvent) => void;

class EventBus {
  private subscribers: Map<string, Set<EventSubscriber>> = new Map();
  private globalSubscribers: Set<EventSubscriber> = new Set();

  /**
   * Subscribe to events for a specific research session
   */
  subscribe(researchId: string, callback: EventSubscriber): () => void {
    if (!this.subscribers.has(researchId)) {
      this.subscribers.set(researchId, new Set());
    }
    const set = this.subscribers.get(researchId)!;
    set.add(callback);

    return () => {
      set.delete(callback);
      if (set.size === 0) {
        this.subscribers.delete(researchId);
      }
    };
  }

  /**
   * Subscribe to all events across all research sessions
   */
  subscribeAll(callback: EventSubscriber): () => void {
    this.globalSubscribers.add(callback);
    return () => {
      this.globalSubscribers.delete(callback);
    };
  }

  /**
   * Publish an event to session subscribers and global subscribers
   */
  publish(event: ResearchEvent): void {
    const sessionSubscribers = this.subscribers.get(event.research_id);
    if (sessionSubscribers) {
      sessionSubscribers.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error(`[EventBus] Error in subscriber for ${event.research_id}:`, err);
        }
      });
    }

    this.globalSubscribers.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error('[EventBus] Error in global subscriber:', err);
      }
    });
  }

  /**
   * Get active subscriber count for telemetry
   */
  getSubscriberCount(researchId?: string): number {
    if (researchId) {
      return this.subscribers.get(researchId)?.size || 0;
    }
    let total = this.globalSubscribers.size;
    this.subscribers.forEach((set) => {
      total += set.size;
    });
    return total;
  }
}

export const eventBus = new EventBus();

