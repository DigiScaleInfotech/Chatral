// Decouples chat writes from the trigger engine / notifications (avoids import cycles).
import { EventEmitter } from 'node:events';

export const events = new EventEmitter();
events.setMaxListeners(50);
const pending = new Set();

/** Fire-and-log: listeners are async and must never break the request that emitted. */
export function emit(name, payload) {
  for (const fn of events.listeners(name)) {
    const p = Promise.resolve()
      .then(() => fn(payload))
      .catch((e) => console.error(`event ${name} listener failed`, e))
      .finally(() => pending.delete(p));
    pending.add(p);
  }
}

/** Resolves once all in-flight listeners finished (used by tests and graceful shutdown). */
export async function idle() {
  while (pending.size) await Promise.allSettled([...pending]);
}
