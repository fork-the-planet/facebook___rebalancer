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
 * OSS Relay adapter — a standard relay-runtime Environment whose network layer
 * posts to /api/graphql.
 *
 * Relay is currently scaffolding: no component executes a GraphQL query, so this
 * exists to keep the provider wiring identical across builds. The OSS
 * /api/graphql route returns 501 (no public schema); if a query is ever added,
 * it will fail loudly rather than silently. The internal adapter re-exports
 * @nest/relay's RelayProvider.
 */

import React, {useMemo} from 'react';
import {RelayEnvironmentProvider} from 'react-relay';
import {
  Environment,
  Network,
  RecordSource,
  Store,
  type FetchFunction,
} from 'relay-runtime';

const fetchFn: FetchFunction = async (params, variables) => {
  const response = await fetch('/api/graphql', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      doc_id: params.id,
      query: params.text,
      variables,
    }),
  });
  return response.json();
};

function createEnvironment(): Environment {
  return new Environment({
    network: Network.create(fetchFn),
    store: new Store(new RecordSource()),
  });
}

export function RelayProvider({children}: {children: React.ReactNode}) {
  const environment = useMemo(() => createEnvironment(), []);
  return (
    <RelayEnvironmentProvider environment={environment}>
      {children}
    </RelayEnvironmentProvider>
  );
}
