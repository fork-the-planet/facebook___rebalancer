import type {Metadata} from 'next';
import './globals.css';
import {ConsoleBridge} from './ConsoleBridge';

export const metadata: Metadata = {
  title: 'Rebalancer Explorer',
  description: 'Explore and analyze Rebalancer runs',
  icons: {
    icon: '/favicon.gif',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ConsoleBridge />
        {children}
      </body>
    </html>
  );
}
