import Image from 'next/image';
import Chat from './components/Chat';
import SplitLanding from './components/SplitLanding';
import { getPublicConfig } from '@/lib/vertical';

export default async function HomePage() {
  const config = await getPublicConfig();

  // Split layout (hero left, chat right) with a live light/dark toggle.
  if (config.layout === 'split') {
    return <SplitLanding config={config} />;
  }

  // Centered layout (default): logo + title header above a single-column chat.
  return (
    <main className="min-h-screen flex flex-col bg-black text-white">
      <header className="flex items-center gap-3 border-b border-white/10 px-6 sm:px-12 py-5">
        <Image
          src={config.logoPath}
          alt={config.siteTitle || config.brandName}
          width={150}
          height={50}
          priority
          className="h-8 w-auto"
        />
        <span className="text-base font-semibold tracking-tight text-white">
          {config.siteTitle || config.brandName}
        </span>
      </header>
      <Chat config={config} theme={config.theme} />
    </main>
  );
}
