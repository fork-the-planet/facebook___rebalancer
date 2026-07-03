import {getTreeNode} from '../../../../lib/client/tree';
import type {
  Handle,
  TreeNodeRequest,
} from '../../../../lib/rebalancer-explorer-types';
import {createHandleRoute} from '../../../../lib/api-handler';

export const POST = createHandleRoute<{
  handle?: Partial<Handle>;
  request?: Partial<TreeNodeRequest>;
}>({
  validate: body =>
    body.request?.expressionId == null
      ? 'Missing required field: request.expressionId'
      : null,
  execute: (handle, body, catToken) =>
    getTreeNode(handle, body.request as TreeNodeRequest, catToken),
});
