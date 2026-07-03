'use client';

import {AuthProvider} from '@platform/auth';
import {RelayProvider} from '@platform/relay';
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider loginPath="/login">
      <RelayProvider>{children}</RelayProvider>
    </AuthProvider>
  );
}
