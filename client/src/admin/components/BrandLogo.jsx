/**
 * Chatral brand marks (transparent PNGs):
 * - ChatralShortLogo: Short "C" icon from logo1.png (logo-short.png).
 * - ChatralFullLogo: Full "Chatral" wordmark from logo.png.
 */
function assetUrl(file) {
  const base = import.meta.env.BASE_URL || '/admin/';
  return `${base.endsWith('/') ? base : `${base}/`}${file}`;
}

export function ChatralShortLogo({ size = 28, dark = true, style = {} }) {
  return (
    <img
      src={assetUrl('logo-short.png')}
      alt="Chatral"
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'block',
        flexShrink: 0,
        filter: dark ? 'brightness(0) invert(1)' : 'none',
        ...style,
      }}
    />
  );
}

export function ChatralFullLogo({ height = 28, dark = true, style = {} }) {
  return (
    <img
      src={assetUrl('logo.png')}
      alt="Chatral"
      style={{
        height,
        width: 'auto',
        objectFit: 'contain',
        display: 'block',
        filter: dark ? 'brightness(0) invert(1)' : 'none',
        ...style,
      }}
    />
  );
}
