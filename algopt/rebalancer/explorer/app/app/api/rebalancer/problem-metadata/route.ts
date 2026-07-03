import {getProblemMetadata} from '../../../../lib/client/handle';
import type {Handle} from '../../../../lib/rebalancer-explorer-types';
import {createHandleRoute} from '../../../../lib/api-handler';

export const POST = createHandleRoute<{handle?: Partial<Handle>}>({
  validate: () => null,
  execute: (handle, _body, catToken) => getProblemMetadata(handle, catToken),
});
