/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @format
 */

/**
 * Entity-data and metric-distribution RPCs (plus typeahead).
 */

import type {
  DataRequest,
  DataResponse,
  Handle,
  MetricDistributionRequest,
  MetricDistributionResponse,
  TypeaheadRequest,
  TypeaheadResponse,
} from '../rebalancer-explorer-types';
import {getRpcClient, RebalancerExplorerBackendError} from './core';

const MAX_POINTS = 1000;

/**
 * Fetch entity data for a loaded sandbox.
 *
 * Routes the RPC to the server identified in the handle.
 */
export async function getEntityData(
  handle: Handle,
  query: DataRequest['query'],
  catToken?: string,
): Promise<DataResponse> {
  try {
    const rpcClient = await getRpcClient(catToken, {
      ip_addr: handle.host,
      port: handle.port,
    });
    const request: DataRequest = {query};
    const response = await rpcClient.getDataV2({handle, request});
    return response as DataResponse;
  } catch (error) {
    throw new RebalancerExplorerBackendError('getEntityData', error);
  }
}

/**
 * Fetch metric distribution data for a loaded sandbox.
 *
 * Routes the RPC to the server identified in the handle.
 */
export async function getMetricDistribution(
  handle: Handle,
  requests: Array<Omit<MetricDistributionRequest, 'maxPoints'>>,
  catToken?: string,
): Promise<MetricDistributionResponse[]> {
  const rpcClient = await getRpcClient(catToken, {
    ip_addr: handle.host,
    port: handle.port,
  });

  const results: MetricDistributionResponse[] = [];
  for (const req of requests) {
    try {
      const request: MetricDistributionRequest = {
        ...req,
        maxPoints: MAX_POINTS,
      };
      const response = await rpcClient.getMetricDistributionV2({
        handle,
        request,
      });
      results.push(response as MetricDistributionResponse);
    } catch (error) {
      throw new RebalancerExplorerBackendError('getMetricDistribution', error);
    }
  }
  return results;
}

/**
 * Fetch typeahead suggestions for a loaded sandbox.
 *
 * Routes the RPC to the server identified in the handle.
 */
export async function getTypeahead(
  handle: Handle,
  entity: string,
  query: string,
  limit: number,
  catToken?: string,
): Promise<TypeaheadResponse> {
  try {
    const rpcClient = await getRpcClient(catToken, {
      ip_addr: handle.host,
      port: handle.port,
    });
    const request: TypeaheadRequest = {entity, query, limit};
    const response = await rpcClient.getTypeaheadV2({handle, request});
    return response as TypeaheadResponse;
  } catch (error) {
    throw new RebalancerExplorerBackendError('getTypeahead', error);
  }
}
