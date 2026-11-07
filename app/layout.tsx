import type { Metadata, Viewport } from 'next';
import { Fraunces, Public_Sans } from 'next/font/google';
import './globals.css';
import { themeInitScript } from '@/lib/themeScript';
import { Providers } from '@/components/layout/Providers';
import { Header } from '@/components/layout/Header';

const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--font-fraunces',
  display: 'swap',
});
const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-public-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Keystone', template: '%s · Keystone' },
  description: 'Keystone finds SB 4 faith- and college-owned land in Orange County for Habitat for Humanity homes. Homeownership that holds.',
  applicationName: 'Keystone',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F7F5' },
    { media: '(prefers-color-scheme: dark)', color: '#0F1513' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fraunces.variable} ${publicSans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Providers>
          <Header />
          <main id="main">{children}</main>
          <div className="film-grain" aria-hidden />
        </Providers>
      </body>
    </html>
  );
}
