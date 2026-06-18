import { getPublicConfig } from '@/lib/vertical';
import EmbedWidgetClient from './EmbedWidgetClient';

/**
 * Iframe target for the embed widget. Server component: loads the vertical
 * config and hands it to the client widget, which manages host postMessage
 * context and renders the chat.
 */
export default async function EmbedWidgetPage() {
  const config = await getPublicConfig();
  return <EmbedWidgetClient config={config} />;
}
