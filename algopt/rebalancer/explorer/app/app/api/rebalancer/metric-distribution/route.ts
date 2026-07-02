import {getMetricDistribution} from '../../../../lib/client/entity';
import type {
  Handle,
  MetricDistributionRequest,
} from '../../../../lib/rebalancer-explorer-types';
import {createHandleRoute} from '../../../../lib/api-handler';

interface MetricDistributionBatchItem {
  entity?: string;
  metric?: string;
}

export const POST = createHandleRoute<{
  handle?: Partial<Handle>;
  requests?: MetricDistributionBatchItem[];
}>({
  validate: body => {
    if (!Array.isArray(body.requests) || body.requests.length === 0) {
      return 'Missing required field: requests (must be a non-empty array)';
    }
    for (let i = 0; i < body.requests.length; i++) {
      const req = body.requests[i];
      if (!req.entity || !req.metric) {
        return `Invalid request at index ${i}: entity and metric are required`;
      }
    }
    return null;
  },
  execute: async (handle, body, catToken) => {
    const validRequests = body.requests as Array<
      Omit<MetricDistributionRequest, 'maxPoints'>
    >;
    const responses = await getMetricDistribution(
      handle,
      validRequests,
      catToken,
    );
    return {responses};
  },
});
