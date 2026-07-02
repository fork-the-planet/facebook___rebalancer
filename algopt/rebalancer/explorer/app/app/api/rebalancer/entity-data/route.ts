import {getEntityData} from '../../../../lib/client/entity';
import type {Handle, Query} from '../../../../lib/rebalancer-explorer-types';
import {createHandleRoute} from '../../../../lib/api-handler';

const MAX_PAGE_LIMIT = 500;

export const POST = createHandleRoute<{
  handle?: Partial<Handle>;
  query?: Partial<Query>;
}>({
  validate: body => {
    if (!body.query?.entity) {
      return 'Missing required field: query.entity';
    }
    if (
      body.query.page?.limit != null &&
      body.query.page.limit > MAX_PAGE_LIMIT
    ) {
      return `Page limit must not exceed ${MAX_PAGE_LIMIT}`;
    }
    return null;
  },
  execute: (handle, body, catToken) =>
    getEntityData(handle, body.query as Query, catToken),
});
