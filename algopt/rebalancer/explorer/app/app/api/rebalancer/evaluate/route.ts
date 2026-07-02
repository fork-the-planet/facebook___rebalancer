import {evaluate} from '../../../../lib/client/evaluation';
import type {
  Assignment,
  Handle,
} from '../../../../lib/rebalancer-explorer-types';
import {createHandleRoute} from '../../../../lib/api-handler';

export const POST = createHandleRoute<{
  handle?: Partial<Handle>;
  assignment?: Partial<Assignment>;
}>({
  validate: body =>
    body.assignment?.base == null
      ? 'Missing required field: assignment.base'
      : null,
  execute: (handle, body, catToken) =>
    evaluate(handle, {assignment: body.assignment as Assignment}, catToken),
});
