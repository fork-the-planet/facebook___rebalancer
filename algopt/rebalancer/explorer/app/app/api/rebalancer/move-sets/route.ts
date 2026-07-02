import {getMoveSets} from '../../../../lib/client/moves';
import type {
  Handle,
  MoveSetsRequest,
} from '../../../../lib/rebalancer-explorer-types';
import {createHandleRoute} from '../../../../lib/api-handler';

const MAX_PAGE_LIMIT = 500;

export const POST = createHandleRoute<{
  handle?: Partial<Handle>;
  request?: Partial<MoveSetsRequest>;
}>({
  validate: body => {
    const req = body.request;
    if (!req?.assignmentA || !req?.assignmentB || !req?.query) {
      return 'Missing required field: request (must include assignmentA, assignmentB, query)';
    }
    if (
      req.query.page?.limit != null &&
      req.query.page.limit > MAX_PAGE_LIMIT
    ) {
      return `Page limit must not exceed ${MAX_PAGE_LIMIT}`;
    }
    return null;
  },
  execute: (handle, body, catToken) =>
    getMoveSets(handle, body.request as MoveSetsRequest, catToken),
});
