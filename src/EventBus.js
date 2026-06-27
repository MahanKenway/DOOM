/**
 * EventBus.js
 * ─────────────────────────────────────────────────────────────────
 * A tiny, zero-dependency publish-subscribe event bus.
 * Allows decoupled communication between Engine, UI, and Audio
 * without direct object references between modules.
 *
 * Design:
 *   • Singleton  (import { EventBus } anywhere)
 *   • Synchronous dispatch  (no async surprises)
 *   • Wildcard listeners via '*'
 *   • Once listeners auto-remove after first call
 *   • Weak references NOT used — callers must call off() to clean up
 * ─────────────────────────────────────────────────────────────────
 */

class Bus {
  /** @type {Map<string, Set<Function>>} */
  #listeners = new Map();

  /**
   * Subscribe to an event.
   * @param {string}   event
   * @param {Function} handler
   * @returns {() => void}  Unsubscribe function
   */
  on(event, handler) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(handler);
    // Return an unsubscribe closure
    return () => this.off(event, handler);
  }

  /**
   * Subscribe to an event exactly once.
   * @param {string}   event
   * @param {Function} handler
   */
  once(event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      handler(...args);
    };
    this.on(event, wrapper);
  }

  /**
   * Unsubscribe a specific handler.
   * @param {string}   event
   * @param {Function} handler
   */
  off(event, handler) {
    this.#listeners.get(event)?.delete(handler);
  }

  /**
   * Publish an event to all subscribers.
   * Also notifies wildcard '*' listeners.
   * @param {string} event
   * @param {*}      [data]
   */
  emit(event, data) {
    const handlers = this.#listeners.get(event);
    if (handlers) {
      for (const h of handlers) {
        try { h(data); }
        catch (err) { console.error(`[EventBus] Handler error for "${event}":`, err); }
      }
    }
    // Wildcard
    const wild = this.#listeners.get('*');
    if (wild) {
      for (const h of wild) {
        try { h(event, data); }
        catch (err) { console.error('[EventBus] Wildcard handler error:', err); }
      }
    }
  }

  /** Remove all listeners for an event (or all events). */
  clear(event) {
    if (event) this.#listeners.delete(event);
    else       this.#listeners.clear();
  }

  /** Return number of listeners for an event (useful for testing). */
  listenerCount(event) {
    return this.#listeners.get(event)?.size ?? 0;
  }
}

// Export a singleton
export const EventBus = new Bus();
