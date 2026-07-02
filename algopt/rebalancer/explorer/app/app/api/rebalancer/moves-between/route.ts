import {getMovesBetweenAssignments} from '../../../../lib/client/moves';
import type {
  Assignment,
  Handle,
} from '../../../../lib/rebalancer-explorer-types';
import {createHandleRoute} from '../../../../lib/api-handler';

export const POST = createHandleRoute<{
  handle?: Partial<Handle>;
  source?: Partial<Assignment>;
  destination?: Partial<Assignment>;
}>({
  validate: body => {
    if (body.source?.base == null) {
      return 'Missing required field: source.base';
    }
    if (body.destination?.base == null) {
      return 'Missing required field: destination.base';
    }
    return null;
  },
  execute: (handle, body, catToken) =>
    getMovesBetweenAssignments(
      handle,
      body.source as Assignment,
      body.destination as Assignment,
      catToken,
    ),
});
