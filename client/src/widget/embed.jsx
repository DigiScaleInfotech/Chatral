/**
 * Install (any site, Shopify: theme.liquid before </body>):
 *   <script src="https://chat.yourdomain.com/widget/chat.js" data-store="pk_..." async></script>
 *
 * Loads asynchronously, renders into a Shadow DOM (theme CSS can't break it, and it can't leak out).
 * The snippet never changes when the widget design is edited/published.
 */
import { createRoot } from 'react-dom/client';
import ChatApp from './ChatApp.jsx';
import { CSS } from './styles.js';

const GOOGLE_FONTS = { Inter: 'Inter:wght@400;600;700', Roboto: 'Roboto:wght@400;500;700', 'Open Sans': 'Open+Sans:wght@400;600;700', Lato: 'Lato:wght@400;700', Montserrat: 'Montserrat:wght@400;600;700' };

const script = document.currentScript || document.querySelector('script[data-store][src*="chat.js"]');
const key = script?.dataset.store;
const api = script?.dataset.api || (script?.src ? new URL(script.src).origin : location.origin);

// Automated search crawlers / bots should not execute the chat widget
const CRAWLER_UA_REGEX = /googlebot|bingbot|yandexbot|duckduckbot|baiduspider|slurp|ahrefsbot|semrushbot|dotbot|petalbot|bytespider|applebot|facebookexternalhit|screaming frog|spider|crawler/i;

function mount() {
  window.__livechat ||= {};
  if (!key || window.__livechat[key]) return; // pasted twice → only one widget
  if (navigator.userAgent && CRAWLER_UA_REGEX.test(navigator.userAgent)) return; // skip bots/crawlers
  window.__livechat[key] = true;
  const host = document.createElement('div');
  host.id = `livechat-${key}`;
  // display:block: themes like Dawn hide `div:empty`, and a shadow host has no light-DOM children.
  host.style.cssText = 'display: block !important; visibility: visible !important; position: fixed !important; bottom: 0 !important; right: 0 !important; width: 0 !important; height: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important; z-index: 2147483000 !important; pointer-events: none !important; overflow: visible !important;';
  host.style.setProperty('--lc-page-font', getComputedStyle(document.body).fontFamily);
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = CSS;
  const container = document.createElement('div');
  shadow.append(style, container);
  createRoot(container).render(<ChatApp api={api} storeKey={key} popout={script?.dataset.popout === '1'} />);
}

// Web fonts must be registered on the document to be usable inside the shadow root.
export function loadFont(family) {
  const spec = GOOGLE_FONTS[family];
  if (!spec || document.querySelector(`link[data-lc-font="${family}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
  link.dataset.lcFont = family;
  document.head.appendChild(link);
}
window.__livechatLoadFont = loadFont;

if (!key) console.warn('[livechat] Missing data-store attribute on the chat.js script tag.');
else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
else mount();
