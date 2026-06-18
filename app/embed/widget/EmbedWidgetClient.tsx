'use client';

import { useEffect, useState } from 'react';
import Chat from '@/app/components/Chat';
import type { PublicVerticalConfig } from '@/lib/vertical';

/**
 * Client half of the embed widget. The host page postMessages its pathname so
 * page-context-aware behavior still works despite the iframe being on a
 * different host:
 *
 *   <iframe src="https://<vertical>.output.systems/embed/widget?ref=...">
 *
 * Host context arrives via postMessage with shape:
 *   { type: 'demo-chat:host-context', pagePath, refParam }
 */
export default function EmbedWidgetClient({ config }: { config: PublicVerticalConfig }) {
  const [pageContext, setPageContext] = useState<string | null>(null);
  const [refParam, setRefParam] = useState<string | null>(null);
  const [contextReady, setContextReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialRef = params.get('ref');
    const initialPage = params.get('host');
    if (initialRef) setRefParam(initialRef);
    if (initialPage) setPageContext(initialPage);

    function onMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type !== 'demo-chat:host-context') return;

      if (typeof data.pagePath === 'string') setPageContext(data.pagePath);
      if (typeof data.refParam === 'string') setRefParam(data.refParam);
      setContextReady(true);
    }
    window.addEventListener('message', onMessage);

    const timer = window.setTimeout(() => setContextReady(true), 200);

    return () => {
      window.removeEventListener('message', onMessage);
      window.clearTimeout(timer);
    };
  }, []);

  if (!contextReady) {
    return (
      <main className="h-screen w-screen bg-black text-white/40 flex items-center justify-center text-sm">
        loading
      </main>
    );
  }

  return (
    <main className="h-screen w-screen bg-black overflow-hidden">
      <Chat
        config={config}
        embedMode
        pageContextOverride={pageContext}
        refParamOverride={refParam}
      />
    </main>
  );
}
