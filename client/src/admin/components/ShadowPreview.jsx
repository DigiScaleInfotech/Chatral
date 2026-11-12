// Renders the real widget UI inside a shadow root, exactly as it is isolated on a storefront.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CSS } from '../../widget/styles.js';

export default function ShadowPreview({ children, style }) {
  const host = useRef(null);
  const [container, setContainer] = useState(null);
  useEffect(() => {
    if (!host.current || host.current.shadowRoot) return;
    const shadow = host.current.attachShadow({ mode: 'open' });
    const css = document.createElement('style');
    css.textContent = CSS;
    const div = document.createElement('div');
    // Full width, otherwise percentage widths inside the preview collapse to 0 in flex parents.
    div.style.width = '100%';
    shadow.append(css, div);
    setContainer(div);
  }, []);
  return <div ref={host} style={style}>{container && createPortal(children, container)}</div>;
}
