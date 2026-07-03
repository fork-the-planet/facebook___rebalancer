import type {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'Login - rebalancer_explorer',
  description: 'Sign in to rebalancer_explorer',
};

export default function UnauthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="@container relative flex grow flex-col">{children}</main>
  );
}
