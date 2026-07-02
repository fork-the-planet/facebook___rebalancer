/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use client';

/**
 * @format
 *
 * OSS auth adapter — a static, single-user identity with no SSO.
 *
 * Rebalancer Explorer is a read-only viewer; external deployments are expected
 * to put their own authentication / ingress in front of it. This provider
 * exposes the same surface as the internal @nest/intern-auth adapter
 * (lib/platform/fb/auth.tsx) so feature code is identical in both builds.
 * Swap in real OAuth/OIDC here if a self-hoster needs per-user identity.
 *
 * The Next.js middleware counterpart (createAuthMiddleware) lives in the
 * sibling, non-client module lib/platform/auth-middleware.ts.
 */

import React, {createContext, useContext} from 'react';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  profile_pic_uri?: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  logout: () => void;
}

const OSS_USER_NAME = process.env.NEXT_PUBLIC_OSS_USER || 'Explorer User';

const STATIC_STATE: AuthState = {
  user: {
    id: 'oss-user',
    name: OSS_USER_NAME,
    username: OSS_USER_NAME.toLowerCase().replace(/\s+/g, '_'),
  },
  loading: false,
  logout: () => {},
};

const AuthContext = createContext<AuthState>(STATIC_STATE);

export function AuthProvider({
  children,
}: {
  // Accepted for API parity with the internal @nest/intern-auth InternAuthProvider.
  // The OSS build has a static identity and no login flow, so it is ignored here.
  loginPath?: string;
  children: React.ReactNode;
}) {
  return (
    <AuthContext.Provider value={STATIC_STATE}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

/**
 * Stand-in for @nest/intern-auth's CATDetectionPage. The OSS build has no login
 * flow (middleware is pass-through and identity is static), so this just points
 * the visitor back to the app.
 */
export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8 text-center">
      <div>
        <h1 className="mb-2 text-lg font-semibold">Rebalancer Explorer</h1>
        <p className="text-sm text-gray-500">
          You are signed in.{' '}
          <a className="underline" href="/">
            Continue
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export function LoggedOutPage({
  loginPath = '/login',
  ButtonComponent,
}: {
  loginPath?: string;
  ButtonComponent?: React.ElementType;
}) {
  const Btn = ButtonComponent;
  return (
    <div className="flex min-h-screen items-center justify-center p-8 text-center">
      <div>
        <h1 className="mb-2 text-lg font-semibold">Signed out</h1>
        {Btn ? (
          <Btn href={loginPath}>Sign in</Btn>
        ) : (
          <a className="underline" href={loginPath}>
            Sign in
          </a>
        )}
      </div>
    </div>
  );
}
