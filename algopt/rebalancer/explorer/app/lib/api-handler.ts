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

import {NextRequest, NextResponse} from 'next/server';

import {extractCatToken, RebalancerExplorerBackendError} from './client/core';
import type {Handle} from './rebalancer-explorer-types';

/**
 * Creates a Next.js POST handler that:
 *  1. Parses the JSON body
 *  2. Validates the `handle` field (manifoldId, host, port, taskId)
 *  3. Runs route-specific validation via `validate`
 *  4. Extracts the CAT token
 *  5. Calls `execute` with the validated handle, body, and catToken
 *  6. Returns the result as JSON, or a 400/500 error
 */
export function createHandleRoute<
  TBody extends {handle?: Partial<Handle>},
>(handler: {
  validate: (body: TBody) => string | null;
  execute: (
    handle: Handle,
    body: TBody,
    catToken: string | undefined,
  ) => Promise<unknown>;
}): (request: NextRequest) => Promise<NextResponse> {
  return async function POST(request: NextRequest) {
    let body: TBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({error: 'Invalid JSON body'}, {status: 400});
    }

    const {handle} = body;
    if (
      !handle?.manifoldId ||
      !handle?.host ||
      handle?.port == null ||
      handle?.taskId == null
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required field: handle (must include manifoldId, host, port, taskId)',
        },
        {status: 400},
      );
    }

    const validationError = handler.validate(body);
    if (validationError != null) {
      return NextResponse.json({error: validationError}, {status: 400});
    }

    const catToken = extractCatToken(request);

    try {
      const result = await handler.execute(handle as Handle, body, catToken);
      return NextResponse.json(result);
    } catch (error) {
      const message =
        error instanceof RebalancerExplorerBackendError
          ? error.backendError
          : 'Internal server error';
      return NextResponse.json({error: message}, {status: 500});
    }
  };
}
