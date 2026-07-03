import {evaluateMetricCollection} from '../../../../lib/client/evaluation';
import type {
  Assignment,
  Handle,
  Query,
} from '../../../../lib/rebalancer-explorer-types';
import {createHandleRoute} from '../../../../lib/api-handler';

const MAX_PAGE_LIMIT = 500;

export const POST = createHandleRoute<{
  handle?: Partial<Handle>;
  query?: Partial<Query>;
  assignmentA?: Partial<Assignment>;
  assignmentB?: Partial<Assignment>;
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
    if (body.assignmentA?.base == null) {
      return 'Missing required field: assignmentA';
    }
    if (body.assignmentB?.base == null) {
      return 'Missing required field: assignmentB';
    }
    return null;
  },
  execute: (handle, body, catToken) =>
    evaluateMetricCollection(
      handle,
      body.query as Query,
      {assignment: body.assignmentA as Assignment},
      {assignment: body.assignmentB as Assignment},
      catToken,
    ),
});
