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
 * Local search profiling RPCs.
 */

import type {
  Handle,
  LocalSearchProfilesResponse,
} from '../rebalancer-explorer-types';
import {getRpcClient, RebalancerExplorerBackendError} from './core';

/**
 * Retrieve per-objective local-search solver profiles for a loaded sandbox.
 *
 * Routes the RPC to the server identified in the handle.
 */
export async function getLocalSearchProfiles(
  handle: Handle,
  catToken?: string,
): Promise<LocalSearchProfilesResponse> {
  try {
    const rpcClient = await getRpcClient(catToken, {
      ip_addr: handle.host,
      port: handle.port,
    });
    const response = await rpcClient.getLocalSearchProfilesV2({handle});
    return response as LocalSearchProfilesResponse;
  } catch (error) {
    throw new RebalancerExplorerBackendError('getLocalSearchProfiles', error);
  }
}
