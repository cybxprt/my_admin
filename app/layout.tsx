import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MY_ADMIN',
  description: 'Production-grade administration and security operations platform',
  metadataBase: new URL('https://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
