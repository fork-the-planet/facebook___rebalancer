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
 * Move-set and move-diff RPCs.
 */

import type {
  Assignment,
  Handle,
  MoveSetsRequest,
  MoveSetsResponse,
  MovesBetweenAssignmentsRequest,
  MovesBetweenAssignmentsResponse,
} from '../rebalancer-explorer-types';
import {getRpcClient, RebalancerExplorerBackendError} from './core';

/**
 * Fetch the set of moves (variable-to-container reassignments) between two assignments.
 *
 * Routes the RPC to the server identified in the handle.
 */
export async function getMovesBetweenAssignments(
  handle: Handle,
  source: Assignment,
  destination: Assignment,
  catToken?: string,
): Promise<MovesBetweenAssignmentsResponse> {
  try {
    const rpcClient = await getRpcClient(catToken, {
      ip_addr: handle.host,
      port: handle.port,
    });
    const request: MovesBetweenAssignmentsRequest = {source, destination};
    const response = await rpcClient.getMovesBetweenAssignmentsV2({
      handle,
      request,
    });
    return response as MovesBetweenAssignmentsResponse;
  } catch (error) {
    throw new RebalancerExplorerBackendError(
      'getMovesBetweenAssignments',
      error,
    );
  }
}

/**
 * Fetch move sets for a loaded sandbox.
 *
 * Routes the RPC to the server identified in the handle.
 */
export async function getMoveSets(
  handle: Handle,
  request: MoveSetsRequest,
  catToken?: string,
): Promise<MoveSetsResponse> {
  try {
    const rpcClient = await getRpcClient(catToken, {
      ip_addr: handle.host,
      port: handle.port,
    });
    const response = await rpcClient.getMoveSets({handle, request});
    return response as MoveSetsResponse;
  } catch (error) {
    throw new RebalancerExplorerBackendError('getMoveSets', error);
  }
}
