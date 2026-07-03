import {getConstraintSpec} from '../../../../lib/client/evaluation';
import type {Handle} from '../../../../lib/rebalancer-explorer-types';
import {createHandleRoute} from '../../../../lib/api-handler';

export const POST = createHandleRoute<{
  handle?: Partial<Handle>;
  name?: string;
}>({
  validate: body => (!body.name ? 'Missing required field: name' : null),
  execute: (handle, body, catToken) =>
    getConstraintSpec(handle, body.name!, catToken),
});
