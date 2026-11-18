// All widget CSS lives inside the Shadow DOM: the store theme can't break it and it can't leak out.
export const FONT_STACKS = {
  inherit: 'var(--lc-page-font, system-ui, sans-serif)',
  system: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  Inter: '"Inter", system-ui, sans-serif',
  Roboto: '"Roboto", system-ui, sans-serif',
  'Open Sans': '"Open Sans", system-ui, sans-serif',
  Lato: '"Lato", system-ui, sans-serif',
  Montserrat: '"Montserrat", system-ui, sans-serif',
  Georgia: 'Georgia, "Times New Roman", serif',
};

export function cssVars(cfg) {
  const c = cfg.colors;
  return {
    '--lc-primary': c.primary, '--lc-header-text': c.headerText, '--lc-vb': c.visitorBubble, '--lc-vt': c.visitorText,
    '--lc-ab': c.agentBubble, '--lc-at': c.agentText, '--lc-bg': c.background,
    '--lc-font': FONT_STACKS[cfg.font.family] || FONT_STACKS.system, '--lc-size': `${cfg.font.size}px`,
    '--lc-w': `${cfg.size.width}px`, '--lc-h': `${cfg.size.height}px`, '--lc-launcher': `${cfg.launcher.size}px`,
    '--lc-x': `${cfg.launcher.offsetX}px`, '--lc-y': `${cfg.launcher.offsetY}px`,
  };
}

export const CSS = `
:host { all: initial; }
* { box-sizing: border-box; }
button, input, textarea, select { font-family: inherit; }
.lc-root { font-family: var(--lc-font); font-size: var(--lc-size); line-height: 1.45; color: #0f172a; -webkit-font-smoothing: antialiased; pointer-events: auto; }
.lc-root, .lc-root * { -webkit-tap-highlight-color: transparent; }
.lc-root.fixed { position: fixed; z-index: 2147483000; bottom: var(--lc-y); }
.lc-root.fixed.right { right: var(--lc-x); }
.lc-root.fixed.left { left: var(--lc-x); }
.lc-launcher { width: var(--lc-launcher); height: var(--lc-launcher); border-radius: 999px; border: 0; cursor: pointer; background: var(--lc-primary); color: var(--lc-header-text);
  display: grid; place-items: center; box-shadow: 0 8px 24px rgba(15,23,42,.25); position: relative; transition: transform .15s; padding: 0; }
.lc-launcher.labeled { width: max-content; padding: 0 20px 0 16px; display: flex; gap: 8px; font: 600 15px var(--lc-font); }
/* The root is as wide as the open panel; keep the launcher on the configured side. */
.lc-root.right .lc-launcher { margin-left: auto; }
.lc-launcher:hover { transform: scale(1.05); }
.lc-launcher:focus-visible, .lc-btn:focus-visible, .lc-icon:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
.lc-badge { position: absolute; top: -4px; right: -4px; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 11px; background: #ef4444; color: #fff; font: 700 12px/22px system-ui; text-align: center; }
.lc-panel { width: var(--lc-w); max-width: calc(100vw - 2 * var(--lc-x)); height: var(--lc-h); max-height: calc(100dvh - var(--lc-y) - var(--lc-launcher) - 32px); background: var(--lc-bg); border-radius: 16px; overflow: hidden;
  box-shadow: 0 16px 48px rgba(15,23,42,.28); display: flex; flex-direction: column; margin-bottom: 14px; transform-origin: bottom right; animation: lc-in .26s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.lc-panel.closing { animation: lc-out .22s cubic-bezier(0.16, 1, 0.3, 1) forwards !important; pointer-events: none; }
.lc-root.left .lc-panel { transform-origin: bottom left; }
@keyframes lc-in { from { opacity: 0; transform: translateY(14px) scale(.92); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes lc-out { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(14px) scale(.92); } }
.lc-root.mobile-full .lc-panel { position: fixed; inset: 8px; width: auto; height: auto; max-height: none; border-radius: 16px; margin: 0; }
.lc-root.mobile-full.open .lc-launcher { display: none; }
@media (max-width: 640px) {
  .lc-root.fixed {
    bottom: max(var(--lc-y), env(safe-area-inset-bottom, 0px));
  }
  .lc-root.fixed.right {
    right: max(var(--lc-x), env(safe-area-inset-right, 0px));
  }
  .lc-root.fixed.left {
    left: max(var(--lc-x), env(safe-area-inset-left, 0px));
  }
  .lc-root.open .lc-preview {
    display: none !important;
  }
  .lc-panel {
    width: min(var(--lc-w), calc(100vw - 2 * max(var(--lc-x), 12px)));
    max-width: calc(100vw - 24px);
    max-height: calc(100dvh - max(var(--lc-y), env(safe-area-inset-bottom, 0px)) - var(--lc-launcher) - 24px);
  }
  .lc-root.mobile-full .lc-panel {
    inset: 8px;
    top: max(8px, env(safe-area-inset-top, 0px));
    bottom: max(8px, env(safe-area-inset-bottom, 0px));
  }
}
.lc-root.inline .lc-panel { max-height: none; margin: 0; }
.lc-head { background: radial-gradient(135% 125% at 0% 0%, color-mix(in srgb, var(--lc-primary) 54%, #ffffff) 0%, color-mix(in srgb, var(--lc-primary) 26%, #ffffff) 52%, color-mix(in srgb, var(--lc-primary) 10%, #ffffff) 100%); color: #0f172a; padding: 10px 12px; display: flex; align-items: center; gap: 6px; flex: none; position: relative; border-bottom: 1px solid color-mix(in srgb, var(--lc-primary) 18%, #e2e8f0); }
.lc-head img.logo { height: 28px; max-width: 90px; object-fit: contain; flex: none; }
.lc-head-brand { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.lc-head-actions { display: flex; align-items: center; gap: 2px; flex: none; }
.lc-avatar { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex: none; background: #ffffff; color: var(--lc-primary); display: grid; place-items: center; font-weight: 700; font-size: 14px; box-shadow: 0 2px 6px rgba(15,23,42,.08); border: 1px solid rgba(255,255,255,0.8); overflow: hidden; }
.lc-title { font-weight: 700; font-size: 14px; color: #0f172a; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lc-sub { color: #475569; font-size: 11.5px; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
.lc-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; display: inline-block; }
.lc-dot.off { background: #94a3b8; }
.lc-grow { flex: 1; min-width: 0; }
.lc-icon { background: transparent; border: 0; color: #475569; cursor: pointer; width: 28px; height: 28px; border-radius: 6px; display: grid; place-items: center; padding: 0; flex: none; transition: all .15s ease; }
.lc-icon:hover { background: rgba(255, 255, 255, 0.65); color: #0f172a; }
.lc-icon svg { width: 16px; height: 16px; }
.lc-body { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 16px 14px; display: flex; flex-direction: column; gap: 10px; background: #f8fafc; overscroll-behavior: contain; }
.lc-row { display: flex; gap: 8px; align-items: flex-end; max-width: 100%; }
.lc-row.me { justify-content: flex-end; }
.lc-row .lc-avatar { width: 28px; height: 28px; font-size: 12px; background: #ffffff; color: var(--lc-primary); border: 1px solid rgba(226, 232, 240, 0.85); box-shadow: 0 1px 3px rgba(15,23,42,.06); font-weight: 700; border-radius: 50%; flex: none; display: grid; place-items: center; }
.lc-bubble { min-width: 0; max-width: 80%; padding: 10px 14px; border-radius: 16px; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13.5px; line-height: 1.45; }
.lc-row.them .lc-bubble { background: #ffffff; color: #0f172a; border: 1px solid rgba(226, 232, 240, 0.9); box-shadow: 0 2px 6px -2px rgba(15,23,42,.04); border-bottom-left-radius: 4px; }
.lc-row.me .lc-bubble { background: var(--lc-vb); color: var(--lc-vt); border-bottom-right-radius: 4px; box-shadow: 0 2px 8px -2px color-mix(in srgb, var(--lc-primary) 32%, transparent); }
.lc-bubble a { color: inherit; text-decoration: underline; font-weight: 500; }
.lc-removed-file { font-size: 12px; font-style: italic; opacity: 0.75; }
.lc-name { font-size: 11.5px; font-weight: 600; color: #64748b; margin: 0 0 2px 36px; }
.lc-meta { font-size: 11px; color: #94a3b8; text-align: right; margin-top: -3px; }
.lc-meta.failed { color: #ef4444; cursor: pointer; }
.lc-system { text-align: center; font-size: 11px; color: #64748b; margin: 6px auto; background: rgba(226, 232, 240, 0.7); padding: 4px 12px; border-radius: 12px; width: fit-content; max-width: 90%; }
.lc-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-left: 36px; }
.lc-chip { border: 1px solid var(--lc-primary); color: var(--lc-primary); background: #fff; border-radius: 999px; padding: 6px 12px; cursor: pointer; font: inherit; font-size: .9em; }
.lc-chip:hover { background: var(--lc-primary); color: var(--lc-header-text); }
.lc-typing { display: inline-flex; gap: 4px; padding: 12px 16px; background: #ffffff; border: 1px solid rgba(226, 232, 240, 0.9); border-radius: 16px; border-bottom-left-radius: 4px; box-shadow: 0 2px 6px -2px rgba(15,23,42,.04); }
.lc-typing i { width: 6px; height: 6px; border-radius: 50%; background: var(--lc-primary); animation: lc-b 1s infinite; }
.lc-typing i:nth-child(2) { animation-delay: .15s; } .lc-typing i:nth-child(3) { animation-delay: .3s; }
@keyframes lc-b { 0%, 60%, 100% { transform: none; opacity: .5; } 30% { transform: translateY(-4px); opacity: 1; } }
.lc-foot { border-top: 1px solid #e2e8f0; padding: 10px 12px; display: flex; gap: 8px; align-items: flex-end; flex: none; background: #ffffff; }
.lc-foot.lc-ended { flex-direction: column; align-items: stretch; gap: 8px; padding: 12px; }
.lc-ended-title { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #0f172a; }
.lc-ended-title svg { width: 18px; height: 18px; }
.lc-ended-text { font-size: .9em; color: #475569; }
.lc-ended-sent { font-size: .85em; color: #15803d; }
.lc-ended-actions { display: flex; gap: 8px; }
.lc-ended-actions .lc-btn { flex: 1; }
.lc-btn.lc-btn-light { background: #e2e8f0; color: #0f172a; }
.lc-foot textarea { flex: 1; resize: none; border: 1px solid #e2e8f0; outline: 0; font: inherit; padding: 9px 14px; max-height: 120px; min-height: 38px; background: #f8fafc; border-radius: 20px; color: #0f172a; font-size: 13.5px; transition: all .16s ease; }
.lc-foot textarea:focus { border-color: var(--lc-primary); background: #ffffff; box-shadow: 0 0 0 3px color-mix(in srgb, var(--lc-primary) 14%, transparent); }
.lc-foot .lc-icon { background: transparent; border: 0; color: #64748b; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; transition: all .15s ease; }
.lc-foot .lc-icon:hover { background: #f1f5f9; color: #0f172a; box-shadow: none; transform: none; }
.lc-send { background: var(--lc-primary) !important; color: var(--lc-header-text) !important; box-shadow: 0 2px 8px -1px color-mix(in srgb, var(--lc-primary) 40%, transparent); transition: transform .15s ease, opacity .15s ease !important; }
.lc-send:not(:disabled):hover { transform: scale(1.05); }
.lc-send:disabled { opacity: .45; cursor: default; }
.lc-form { display: flex; flex-direction: column; gap: 10px; padding: 4px 2px; }
.lc-form.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; margin-left: 36px; }
.lc-form label { font-size: .82em; color: #475569; display: flex; flex-direction: column; gap: 4px; }
.lc-form input, .lc-form textarea { font: inherit; padding: 9px 10px; border: 1px solid #cbd5e1; border-radius: 8px; outline: 0; color: #0f172a; background: #fff; }
/* iOS Safari/Chrome zoom the whole page on focus of any text input under 16px; force 16px+ on phones
   regardless of the configured text size, so typing in the pre-chat form, composer or any other form
   field never triggers it (desktop keeps the configured size). */
@media (max-width: 640px) { .lc-root input, .lc-root textarea, .lc-root select { font-size: max(16px, var(--lc-size)) !important; } }
.lc-form input:focus, .lc-form textarea:focus { border-color: var(--lc-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--lc-primary) 20%, transparent); }
.lc-btn { background: var(--lc-primary); color: var(--lc-header-text); border: 0; border-radius: 8px; padding: 10px 14px; font: inherit; font-weight: 600; cursor: pointer; }
.lc-btn:disabled { opacity: .6; cursor: default; }
.lc-err { color: #dc2626; font-size: .82em; }
.lc-note { color: #475569; font-size: .92em; }
.lc-menu { position: absolute; top: 46px; right: 10px; z-index: 5; min-width: 200px; background: #fff; color: #0f172a; border-radius: 10px; box-shadow: 0 10px 30px rgba(15,23,42,.18); padding: 6px; display: flex; flex-direction: column; }
.lc-menu-item { all: unset; cursor: pointer; padding: 9px 12px; border-radius: 6px; font-size: 13.5px; }
.lc-menu-item:hover, .lc-menu-item:focus-visible { background: #f1f5f9; }
.lc-menu-item.danger { color: #dc2626; }
.lc-head { position: relative; }
.lc-banner.info { background: #eff6ff; color: #1e3a8a; cursor: pointer; }
.lc-link { all: unset; cursor: pointer; color: var(--lc-primary); font-size: 13px; margin-bottom: 4px; }
.lc-checks { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; font-weight: 400; }
.lc-check { display: flex; align-items: center; gap: 8px; }
.lc-form select { font: inherit; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; }
.lc-root.popout { position: fixed; inset: 0; }
.lc-root.popout .lc-panel { width: 100%; max-width: none; height: 100%; max-height: none; margin: 0; border-radius: 0; }
.lc-popout-msg { font: 15px system-ui, sans-serif; color: #334155; padding: 40px 24px; text-align: center; }
.lc-retention { text-align: center; color: #64748b; font-size: 11px; line-height: 1.4; margin: 0 auto 10px; max-width: 260px; }
.lc-center { margin: auto; text-align: center; padding: 24px; color: #475569; }
.lc-file { display: flex; align-items: center; gap: 8px; text-decoration: none; }
.lc-img { display: block; width: auto; height: auto; max-width: 100%; max-height: 200px; object-fit: cover; border-radius: 12px; cursor: zoom-in; box-shadow: 0 1px 4px rgba(15,23,42,.15); }
.lc-bubble.media { padding: 0; background: transparent !important; max-width: 200px; }
.lc-bubble.media .lc-file { background: var(--lc-ab); color: var(--lc-at); padding: 9px 12px; border-radius: 12px; }
.lc-bubble a:has(> .lc-img) { display: block; max-width: 100%; }
.lc-banner { background: #fef3c7; color: #92400e; font-size: .8em; padding: 6px 12px; text-align: center; flex: none; margin: 8px 10px 0; border-radius: 10px; }
.lc-powered { text-align: center; font-size: 11px; color: #64748b; padding: 6px 12px 7px; background: #f8fafc; border-top: 1px solid #f1f5f9; flex: none; user-select: none; }
.lc-powered-link { color: #64748b; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 4px; font-weight: 500; cursor: pointer; transition: color .15s ease; }
.lc-powered-link:hover { color: var(--lc-primary, #2563eb); }
.lc-powered-link strong { color: #0f172a; font-weight: 700; }
.lc-powered-link:hover strong { color: var(--lc-primary, #2563eb); }
.lc-preview { width: max-content; max-width: min(300px, calc(100vw - 2 * var(--lc-x))); margin-bottom: 10px; padding: 10px 6px 10px 12px; display: flex; gap: 4px; align-items: flex-start; background: #fff; color: #0f172a; border-radius: 14px; box-shadow: 0 8px 24px rgba(15,23,42,.18); animation: lc-in .18s ease-out; }
.lc-root.right .lc-preview { margin-left: auto; }
.lc-preview-body { all: unset; cursor: pointer; display: flex; flex-direction: column; gap: 2px; min-width: 0; font-size: .92em; }
.lc-preview-body span { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; color: #334155; }
.lc-preview-body:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; border-radius: 6px; }
.lc-icon.lc-preview-close { width: 26px; height: 26px; color: #64748b; flex: none; }
.lc-icon.lc-preview-close:hover { background: #f1f5f9; }
.lc-icon.lc-preview-close svg { width: 14px; height: 14px; }

/* Help Center & 2-Tab Navigation (Intercom / Product Hunt Style) */
.lc-tabs { display: flex; justify-content: space-around; align-items: center; border-top: 1px solid #f1f5f9; background: #ffffff; padding: 6px 12px 7px; flex: none; }
.lc-tab { all: unset; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; font-size: 11.5px; font-weight: 500; color: #94a3b8; padding: 2px 24px; border-radius: 8px; position: relative; transition: color .15s ease; text-align: center; }
.lc-tab:hover { color: #475569; }
.lc-tab.active { color: var(--lc-primary); font-weight: 600; background: none; }
.lc-tab svg { width: 19px; height: 19px; }
.lc-tab-badge { position: absolute; top: -1px; right: 22%; min-width: 15px; height: 15px; padding: 0 4px; border-radius: 8px; background: #ef4444; color: #fff; font: 700 9.5px/15px system-ui; text-align: center; }

/* Home Hero with richer mesh gradient & floating brand pill */
.lc-home-hero { background: radial-gradient(135% 125% at 0% 0%, color-mix(in srgb, var(--lc-primary) 54%, #ffffff) 0%, color-mix(in srgb, var(--lc-primary) 26%, #ffffff) 52%, color-mix(in srgb, var(--lc-primary) 10%, #ffffff) 100%); padding: 16px 18px 12px; display: flex; flex-direction: column; flex: none; position: relative; }
.lc-home-hero-top { display: flex; justify-content: space-between; align-items: center; min-height: 34px; }
.lc-brand-pill { width: 34px; height: 34px; border-radius: 50%; background: #ffffff; box-shadow: 0 2px 8px rgba(15,23,42,.08); display: flex; align-items: center; justify-content: center; overflow: hidden; flex: none; }
.lc-brand-pill img { width: 22px; height: 22px; object-fit: contain; }
.lc-brand-initial { font-size: 15px; font-weight: 700; color: var(--lc-primary); line-height: 1; }
.lc-home-close { all: unset; cursor: pointer; width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; color: #475569; background: rgba(255,255,255,.75); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.5); transition: all .16s ease; }
.lc-home-close:hover { background: #ffffff; color: #0f172a; box-shadow: 0 2px 8px rgba(15,23,42,.1); transform: scale(1.04); }
.lc-home-close svg { width: 15px; height: 15px; }

.lc-home-greeting { font-size: 14.5px; font-weight: 500; color: #475569; line-height: 1.3; margin-top: 10px; }
.lc-home-title { font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.25; letter-spacing: -0.3px; margin-top: 2px; }
.lc-online-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: #475569; margin-top: 4px; }
.lc-online-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 2.5px rgba(16, 185, 129, 0.25); animation: lc-pulse 2s infinite ease-in-out; flex: none; }
@keyframes lc-pulse { 0%, 100% { box-shadow: 0 0 0 2.5px rgba(16, 185, 129, 0.25); } 50% { box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.08); } }

/* Scrollable cards canvas */
.lc-home-scroll { flex: 1; overflow-y: auto; padding: 10px 16px 18px; display: flex; flex-direction: column; gap: 10px; background: #f8fafc; overscroll-behavior: contain; }

/* Article Card */
.lc-card-premium { background: #ffffff; border-radius: 14px; padding: 13px 16px; cursor: pointer; transition: all .2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 2px 8px -2px rgba(15,23,42,.04), 0 1px 2px rgba(15,23,42,.02); border: 1px solid rgba(226, 232, 240, 0.85); display: flex; align-items: center; justify-content: space-between; gap: 12px; text-align: left; }
.lc-card-premium:hover { transform: translateY(-2px); box-shadow: 0 8px 24px -4px rgba(15,23,42,.09); border-color: color-mix(in srgb, var(--lc-primary) 38%, transparent); }
.lc-card-premium-main { min-width: 0; flex: 1; }
.lc-card-premium-title { font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 3px; line-height: 1.35; }
.lc-card-premium-desc { font-size: 12.5px; color: #64748b; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.lc-card-premium-arrow { color: #94a3b8; flex: none; display: grid; place-items: center; transition: all .2s ease; }
.lc-card-premium:hover .lc-card-premium-arrow { color: var(--lc-primary); transform: translateX(3px); }

/* Send us a message card */
.lc-send-card { background: #ffffff; border-radius: 14px; padding: 13px 16px; cursor: pointer; transition: all .2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 2px 8px -2px rgba(15,23,42,.04), 0 1px 2px rgba(15,23,42,.02); border: 1.5px solid color-mix(in srgb, var(--lc-primary) 28%, #e2e8f0); display: flex; align-items: center; justify-content: space-between; gap: 12px; text-align: left; }
.lc-send-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px -4px color-mix(in srgb, var(--lc-primary) 16%, rgba(0,0,0,0.06)); border-color: var(--lc-primary); }
.lc-send-card:hover .lc-send-arrow { transform: translateX(3px); }
.lc-send-icon-wrap { width: 36px; height: 36px; border-radius: 10px; background: color-mix(in srgb, var(--lc-primary) 12%, transparent); color: var(--lc-primary); display: grid; place-items: center; flex: none; }
.lc-send-icon-wrap svg { width: 18px; height: 18px; }
.lc-send-text { min-width: 0; flex: 1; }
.lc-send-title { font-size: 14px; font-weight: 600; color: #0f172a; line-height: 1.3; }
.lc-send-desc { font-size: 12.5px; color: #64748b; margin-top: 1px; line-height: 1.35; }
.lc-send-arrow { color: var(--lc-primary); flex: none; display: grid; place-items: center; transition: transform .2s ease; }

/* Recent message card */
.lc-recent-card { background: #ffffff; border-radius: 14px; padding: 13px 16px; cursor: pointer; transition: all .2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 2px 8px -2px rgba(15,23,42,.04), 0 1px 2px rgba(15,23,42,.02); border: 1px solid rgba(226, 232, 240, 0.85); display: flex; flex-direction: column; gap: 8px; text-align: left; }
.lc-recent-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px -4px rgba(15,23,42,.08); border-color: color-mix(in srgb, var(--lc-primary) 35%, transparent); }
.lc-recent-header { display: flex; justify-content: space-between; align-items: center; }
.lc-recent-label { font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.3px; }
.lc-recent-time { font-size: 11px; color: #94a3b8; }
.lc-recent-body { display: flex; align-items: center; gap: 9px; }
.lc-recent-body .lc-avatar { width: 28px; height: 28px; font-size: 12px; flex: none; }
.lc-recent-content { min-width: 0; flex: 1; }
.lc-recent-name { font-size: 13px; font-weight: 600; color: #0f172a; }
.lc-recent-snippet { font-size: 12.5px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }

/* Article view */
.lc-faq-article-view { flex: 1; overflow-y: auto; padding: 18px 18px; background: #ffffff; display: flex; flex-direction: column; gap: 12px; overscroll-behavior: contain; }
.lc-faq-tag { display: inline-block; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; background: #eff6ff; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; align-self: flex-start; }
.lc-faq-article-q { font-size: 1.25em; font-weight: 700; color: #0f172a; line-height: 1.3; }
.lc-faq-article-a { font-size: 0.95em; line-height: 1.6; color: #334155; white-space: pre-wrap; word-break: break-word; }

.lc-faq-cta { margin-top: 16px; padding: 16px; background: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; text-align: center; display: flex; flex-direction: column; gap: 8px; }
.lc-faq-cta-title { font-weight: 600; font-size: 0.95em; color: #0f172a; }
.lc-faq-cta-sub { font-size: 0.85em; color: #64748b; }

/* Messages Overview Screen (Intercom / Product Hunt Style) */
.lc-messages-list-canvas { flex: 1; overflow-y: auto; padding: 14px 16px 20px; display: flex; flex-direction: column; gap: 12px; background: #f8fafc; overscroll-behavior: contain; }
.lc-conv-card { background: #ffffff; border-radius: 14px; padding: 13px 15px; cursor: pointer; transition: all .2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 2px 8px -2px rgba(15,23,42,.04), 0 1px 2px rgba(15,23,42,.02); border: 1px solid rgba(226, 232, 240, 0.85); display: flex; align-items: center; gap: 12px; text-align: left; }
.lc-conv-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px -4px rgba(15,23,42,.09); border-color: color-mix(in srgb, var(--lc-primary) 38%, transparent); }
.lc-conv-avatar { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f1f5f9; flex: none; }
.lc-conv-avatar img { width: 100%; height: 100%; object-fit: cover; }
.lc-conv-avatar .lc-avatar { width: 40px; height: 40px; font-size: 15px; }
.lc-conv-content { min-width: 0; flex: 1; }
.lc-conv-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
.lc-conv-name { font-size: 13.5px; font-weight: 600; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lc-conv-time { font-size: 11px; color: #94a3b8; font-weight: 500; flex: none; margin-left: 8px; }
.lc-conv-snippet { font-size: 12.5px; color: #64748b; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
.lc-conv-chevron { color: #94a3b8; flex: none; display: grid; place-items: center; transition: transform .2s ease, color .2s ease; }
.lc-conv-card:hover .lc-conv-chevron { color: var(--lc-primary); transform: translateX(3px); }

.lc-conv-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center; color: #64748b; }
.lc-conv-empty-icon { width: 48px; height: 48px; border-radius: 50%; background: #eff6ff; color: var(--lc-primary); display: grid; place-items: center; margin-bottom: 12px; }
.lc-conv-empty-icon svg { width: 24px; height: 24px; }
.lc-conv-empty-title { font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
.lc-conv-empty-desc { font-size: 12.5px; color: #94a3b8; max-width: 240px; line-height: 1.45; }

.lc-messages-action { margin-top: auto; padding-top: 14px; display: flex; justify-content: center; }
.lc-btn-send-message { all: unset; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: var(--lc-primary); color: #ffffff; font-weight: 600; font-size: 13.5px; padding: 10px 22px; border-radius: 999px; box-shadow: 0 4px 14px -2px color-mix(in srgb, var(--lc-primary) 35%, rgba(0,0,0,0.12)); transition: all .2s ease; }
.lc-btn-send-message:hover { transform: translateY(-2px); box-shadow: 0 6px 20px -2px color-mix(in srgb, var(--lc-primary) 50%, rgba(0,0,0,0.18)); filter: brightness(1.05); }
.lc-btn-send-message:active { transform: scale(0.97); }
.lc-btn-send-message svg { width: 14px; height: 14px; }

@media (prefers-reduced-motion: reduce) { .lc-panel, .lc-typing i, .lc-launcher { animation: none; transition: none; } }
`;
