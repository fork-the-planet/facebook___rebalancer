import {NextRequest, NextResponse} from 'next/server';

import {getHandleSticky} from '@platform/stickiness';

import {
  extractCatToken,
  RebalancerExplorerBackendError,
} from '../../../../lib/client/core';

export async function POST(request: NextRequest) {
  let body: {manifoldId?: string};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({error: 'Invalid JSON body'}, {status: 400});
  }

  const {manifoldId} = body;
  if (!manifoldId) {
    return NextResponse.json(
      {error: 'Missing required field: manifoldId'},
      {status: 400},
    );
  }

  const catToken = extractCatToken(request);

  try {
    const handle = await getHandleSticky(manifoldId, catToken);
    return NextResponse.json(handle);
  } catch (error) {
    const message =
      error instanceof RebalancerExplorerBackendError
        ? error.backendError
        : 'Internal server error';
    return NextResponse.json({error: message}, {status: 500});
  }
}
