import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { themeInitScript } from '@/lib/insights/theme';
import { getPublicConfig } from '@/lib/vertical';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPublicConfig();
  const title = config.siteTitle || config.brandName;
  const description = `Chat with ${config.brandName}. Ask a question or get help, any time.`;

  return {
    metadataBase: new URL(config.siteUrl),
    title: {
      default: title,
      template: `%s, ${config.brandName}`,
    },
    description,
    applicationName: config.brandName,
    openGraph: {
      type: 'website',
      siteName: config.brandName,
      title,
      description,
      url: config.siteUrl,
      images: [{ url: config.logoPath, width: 1200, height: 360, alt: config.brandName }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [config.logoPath],
    },
    icons: {
      icon: [{ url: '/favicon.png', type: 'image/png' }],
    },
    // Demos should not be indexed by search engines.
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-black text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
