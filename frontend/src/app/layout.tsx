import type { Metadata } from 'next';
import { Lora, Manrope } from 'next/font/google';
import './globals.css';

const lora = Lora({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700'],
  variable: '--font-lora',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Кварта — обжарка кофе в Минске',
  description:
    'Маленькая мастерская в Минске: жарим кофе по четвергам партиями по 5 кг, в пятницу развозим по городу. Подписка и разовые заказы, зерно приезжает на 1–3 день после обжарки.',
  openGraph: {
    title: 'Кварта — обжарка кофе в Минске',
    description:
      'Жарим по четвергам, развозим по Минску в пятницу. Кофе доезжает на 1–3 день после обжарки.',
    type: 'website',
    locale: 'ru_RU',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Кварта — обжарка кофе' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // расширения вроде тёмной темы дописывают атрибуты в <html> до гидратации —
    // глушим их расхождение, свои атрибуты здесь статичны
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${lora.variable} ${manrope.variable}`}
    >
      <body className="bg-cream-50 font-sans text-espresso-900 antialiased">
        {children}
      </body>
    </html>
  );
}
