/**
 * Privacy-first lightweight analytics event tracker.
 * Dispatches to Google Analytics 4 (gtag), Google Tag Manager (dataLayer),
 * or custom listeners safely without crashing if blockers are active.
 */
export function trackEvent(eventName, params = {}) {
  try {
    if (typeof window !== 'undefined') {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params);
      }
      if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: eventName, ...params });
      }
    }
  } catch {
    // silently fail
  }
}
