/**
 * Output Systems chatbot embed bootstrap.
 *
 * Drop this on any page to add the floating chatbot bubble:
 *
 *   <script async src="https://chat.output.systems/embed.js"></script>
 *
 * No React, no build step. Vanilla JS so it loads fast on Elementor / WordPress
 * without conflicting with anything else on the page.
 *
 * The bubble click expands an iframe to /embed/widget on chat.output.systems.
 * Host-page context (pathname + ref param) is passed via postMessage so the
 * chatbot's greeting and source tagging stay accurate.
 */
(function () {
  if (window.__OUTPUT_CHATBOT_LOADED__) return;
  window.__OUTPUT_CHATBOT_LOADED__ = true;

  var EMBED_ORIGIN = (function () {
    // Resolve from the script tag that loaded this file.
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || '';
      if (src.indexOf('/embed.js') !== -1) {
        try {
          return new URL(src).origin;
        } catch (e) {
          // fall through
        }
      }
    }
    return 'https://chat.output.systems';
  })();

  var TEAL = '#1ae0cb';
  var BLACK = '#000000';
  var WHITE = '#ffffff';

  // Mobile (max-width 640px): keep the previous compact stack — icon on top,
  // label centered underneath, smaller icon, smaller label font. Mobile
  // overrides the desktop layout below.
  var mobileStyles = document.createElement('style');
  mobileStyles.textContent =
    '@media (max-width: 640px){' +
      '#output-chatbot-bubble-container{' +
        'bottom:5vh !important;' +
        'flex-direction:column-reverse !important;' +
        'gap:6px !important;' +
        'padding:6px 12px 10px !important;' +
        'border-radius:22px !important;' +
        'align-items:center !important;' +
      '}' +
      '#output-chatbot-bubble{' +
        'width:48px !important;' +
        'height:48px !important;' +
      '}' +
      '#output-chatbot-bubble svg{' +
        'width:22px !important;' +
        'height:22px !important;' +
      '}' +
      '#output-chatbot-bubble-label{' +
        'font-size:12px !important;' +
        'max-width:130px;' +
        'white-space:normal !important;' +
        'line-height:1.25 !important;' +
        'text-align:center !important;' +
      '}' +
    '}';
  document.head.appendChild(mobileStyles);

  // ---------- Bubble container (desktop: label on top in 2 rows, icon below 50% larger) ----------
  var bubbleContainer = document.createElement('div');
  bubbleContainer.id = 'output-chatbot-bubble-container';
  bubbleContainer.setAttribute('role', 'button');
  bubbleContainer.setAttribute('tabindex', '0');
  bubbleContainer.setAttribute('aria-label', 'Open Output chatbot');
  bubbleContainer.style.cssText = [
    'position:fixed',
    'right:20px',
    'bottom:calc(20px + 5vh)',
    'z-index:2147483646',
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'gap:10px',
    'padding:12px 18px 14px',
    'background:rgba(0,0,0,0.72)',
    '-webkit-backdrop-filter:blur(8px)',
    'backdrop-filter:blur(8px)',
    'border:1px solid rgba(255,255,255,0.08)',
    'border-radius:24px',
    'box-shadow:0 8px 24px rgba(0,0,0,0.45)',
    'cursor:pointer',
    'font-family:Inter,system-ui,sans-serif',
    'transition:transform 0.18s ease',
  ].join(';');

  // ---------- Label (two rows on desktop via explicit <br>) ----------
  var bubbleLabel = document.createElement('span');
  bubbleLabel.id = 'output-chatbot-bubble-label';
  bubbleLabel.innerHTML = 'Chat with us';
  bubbleLabel.style.cssText = [
    'color:' + WHITE,
    'font-size:14px',
    'font-weight:500',
    'line-height:1.35',
    'letter-spacing:-0.1px',
    'text-align:center',
    'pointer-events:none',
  ].join(';');

  // ---------- Bubble (circular icon button, 72px on desktop = 50% bigger than before) ----------
  var bubble = document.createElement('button');
  bubble.id = 'output-chatbot-bubble';
  bubble.setAttribute('aria-label', 'Open Output chatbot');
  bubble.style.cssText = [
    'width:72px',
    'height:72px',
    'border-radius:50%',
    'background:' + TEAL,
    'color:' + BLACK,
    'border:none',
    'cursor:pointer',
    'box-shadow:0 4px 12px rgba(0,0,0,0.35)',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'flex-shrink:0',
    'padding:0',
  ].join(';');

  // Crosshair-ish chat icon (simple SVG, matches brand). Desktop renders at 33px,
  // mobile media query knocks the bubble + svg back down to 48px / 22px.
  bubble.innerHTML =
    '<svg width="33" height="33" viewBox="0 0 24 24" fill="none" stroke="' +
    BLACK +
    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' +
    '</svg>';

  bubbleContainer.appendChild(bubbleLabel);
  bubbleContainer.appendChild(bubble);

  bubbleContainer.addEventListener('mouseenter', function () {
    bubbleContainer.style.transform = 'translateY(-2px)';
  });
  bubbleContainer.addEventListener('mouseleave', function () {
    bubbleContainer.style.transform = 'translateY(0)';
  });

  // ---------- Backdrop ----------
  // Dims the host page behind the panel so the surrounding site does not
  // compete for attention while the chatbot is open. Click-to-close.
  var backdrop = document.createElement('div');
  backdrop.id = 'output-chatbot-backdrop';
  backdrop.style.cssText = [
    'position:fixed',
    'inset:0',
    'background:rgba(0,0,0,0.6)',
    'z-index:2147483645',
    'display:none',
    'cursor:pointer',
  ].join(';');

  // ---------- Panel + iframe ----------
  var panel = document.createElement('div');
  panel.id = 'output-chatbot-panel';
  panel.style.cssText = [
    'position:fixed',
    'right:20px',
    'bottom:90px',
    'z-index:2147483647',
    'width:380px',
    'height:80vh',
    'max-width:calc(100vw - 40px)',
    'max-height:calc(100vh - 110px)',
    'background:' + BLACK,
    'border:1px solid rgba(255,255,255,0.12)',
    'border-radius:16px',
    'box-shadow:0 16px 48px rgba(0,0,0,0.5)',
    'overflow:hidden',
    'display:none',
    'flex-direction:column',
    'font-family:Inter,system-ui,sans-serif',
  ].join(';');

  // Panel header (close button + brand mark)
  var header = document.createElement('div');
  header.style.cssText = [
    'display:flex',
    'align-items:center',
    'justify-content:space-between',
    'padding:10px 14px',
    'border-bottom:1px solid rgba(255,255,255,0.08)',
    'color:' + WHITE,
    'font-size:13px',
    'font-weight:600',
    'background:' + BLACK,
  ].join(';');

  var label = document.createElement('span');
  label.textContent = 'CHAT';
  label.style.cssText = 'color:' + WHITE + ';';

  var closeBtn = document.createElement('button');
  closeBtn.setAttribute('aria-label', 'Close chatbot');
  closeBtn.innerHTML =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="' +
    WHITE +
    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
    '</svg>';
  closeBtn.style.cssText = [
    'background:transparent',
    'border:none',
    'cursor:pointer',
    'padding:4px',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'opacity:0.7',
    'transition:opacity 0.15s ease',
  ].join(';');
  closeBtn.addEventListener('mouseenter', function () {
    closeBtn.style.opacity = '1';
  });
  closeBtn.addEventListener('mouseleave', function () {
    closeBtn.style.opacity = '0.7';
  });

  header.appendChild(label);
  header.appendChild(closeBtn);

  // Iframe container (lazy-loaded on first open)
  var iframeContainer = document.createElement('div');
  iframeContainer.style.cssText = 'flex:1;background:' + BLACK + ';overflow:hidden;';

  panel.appendChild(header);
  panel.appendChild(iframeContainer);

  // ---------- Open / close ----------
  var iframe = null;
  var isOpen = false;

  function postContextToIframe() {
    if (!iframe || !iframe.contentWindow) return;
    var params = new URLSearchParams(window.location.search);
    iframe.contentWindow.postMessage(
      {
        type: 'demo-chat:host-context',
        pagePath: window.location.pathname,
        refParam: params.get('ref'),
      },
      EMBED_ORIGIN,
    );
  }

  function ensureIframe() {
    if (iframe) return iframe;
    iframe = document.createElement('iframe');
    iframe.src = EMBED_ORIGIN + '/embed/widget';
    iframe.title = 'Output chatbot';
    iframe.style.cssText = 'width:100%;height:100%;border:none;background:' + BLACK + ';';
    iframe.setAttribute('allow', 'clipboard-write; microphone');
    iframe.addEventListener('load', function () {
      // Slight delay to let the iframe set up its message listener.
      setTimeout(postContextToIframe, 50);
    });
    iframeContainer.appendChild(iframe);
    return iframe;
  }

  function openPanel() {
    ensureIframe();
    backdrop.style.display = 'block';
    panel.style.display = 'flex';
    bubbleContainer.style.display = 'none';
    isOpen = true;
  }

  function closePanel() {
    backdrop.style.display = 'none';
    panel.style.display = 'none';
    bubbleContainer.style.display = 'flex';
    isOpen = false;
  }

  bubbleContainer.addEventListener('click', openPanel);
  bubbleContainer.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPanel();
    }
  });
  closeBtn.addEventListener('click', closePanel);
  backdrop.addEventListener('click', closePanel);

  // ESC closes the panel
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) closePanel();
  });

  // Listen for close requests from inside the iframe (future use, e.g. after booking).
  window.addEventListener('message', function (event) {
    if (event.origin !== EMBED_ORIGIN) return;
    if (!event.data || typeof event.data !== 'object') return;
    if (event.data.type === 'demo-chat:close') {
      closePanel();
    }
  });

  // Mount on DOM ready (or immediately if already past it).
  function mount() {
    document.body.appendChild(bubbleContainer);
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
