import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

type EventType =
  | 'opportunity_click'
  | 'opportunity_save'
  | 'opportunity_unsave'
  | 'opportunity_apply'
  | 'opportunities_refresh_from_sources'
  | 'copilot_query'
  | 'copilot_quick_action'
  | 'copilot_add_todo'
  | 'copilot_send_to_planner'
  | 'copilot_add_to_planner'
  | 'profile_save'
  | 'path_enrolled'
  | 'path_module_completed'
  | 'path_unenrolled'
  | 'path_pinned'
  | 'pathway_generated'
  | 'pathway_opened'
  | 'pathway_step_to_planner'
  | 'pathway_deleted'
  | 'gai_pane_opened'
  | 'gai_pane_message'
  | 'gai_pane_todo_to_planner';

interface AnalyticsEvent {
  event: EventType;
  userId: string;
  properties?: Record<string, string | number | boolean | undefined>;
}

const EVENTS_COLLECTION = 'analytics_events';

// Debounce buffer to batch writes
let buffer: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL_MS = 5000;
const MAX_BUFFER_SIZE = 10;

async function flush() {
  if (buffer.length === 0) return;
  const batch = [...buffer];
  buffer = [];

  const eventsRef = collection(db, EVENTS_COLLECTION);
  const timestamp = new Date().toISOString();

  // Write in parallel, fire-and-forget
  await Promise.allSettled(
    batch.map(evt =>
      addDoc(eventsRef, {
        ...evt,
        timestamp,
        properties: evt.properties ?? null,
      })
    )
  );
}

/**
 * Track a product event. Batches writes for efficiency.
 * Fire-and-forget — never throws.
 */
export function trackEvent(event: EventType, userId: string, properties?: Record<string, string | number | boolean | undefined>) {
  try {
    buffer.push({ event, userId, properties });

    if (buffer.length >= MAX_BUFFER_SIZE) {
      flush().catch(() => {});
      if (flushTimer) clearTimeout(flushTimer);
      flushTimer = null;
    } else if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flush().catch(() => {});
        flushTimer = null;
      }, FLUSH_INTERVAL_MS);
    }
  } catch {
    // Analytics should never break the app
  }
}
