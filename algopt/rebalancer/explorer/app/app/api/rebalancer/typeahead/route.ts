import {getTypeahead} from '../../../../lib/client/entity';
import type {Handle} from '../../../../lib/rebalancer-explorer-types';
import {createHandleRoute} from '../../../../lib/api-handler';

export const POST = createHandleRoute<{
  handle?: Partial<Handle>;
  entity?: string;
  query?: string;
  limit?: number;
}>({
  validate: body => {
    if (!body.entity) {
      return 'Missing required field: entity';
    }
    if (body.query == null || typeof body.query !== 'string') {
      return 'Missing required field: query';
    }
    return null;
  },
  execute: (handle, body, catToken) => {
    const resolvedLimit =
      typeof body.limit === 'number' && body.limit > 0 ? body.limit : 10;
    return getTypeahead(
      handle,
      body.entity!,
      body.query!,
      resolvedLimit,
      catToken,
    );
  },
});
