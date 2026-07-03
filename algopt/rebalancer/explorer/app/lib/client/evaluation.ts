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
 * Evaluation and constraint/goal spec RPCs.
 */

import type {
  ConstraintSpecRequest,
  ConstraintSpecResponse,
  DataRequest,
  EvaluateRequest,
  EvaluateResponse,
  GoalSpecRequest,
  GoalSpecResponse,
  Handle,
  Query,
  Result,
} from '../rebalancer-explorer-types';
import {getRpcClient, RebalancerExplorerBackendError} from './core';

/**
 * Evaluate constraints and objectives for a given assignment.
 *
 * Routes the RPC to the server identified in the handle.
 */
export async function evaluate(
  handle: Handle,
  evaluateRequest: EvaluateRequest,
  catToken?: string,
): Promise<EvaluateResponse> {
  try {
    const rpcClient = await getRpcClient(catToken, {
      ip_addr: handle.host,
      port: handle.port,
    });
    const request = evaluateRequest;
    const response = await rpcClient.evaluateV2({handle, request});
    return response as EvaluateResponse;
  } catch (error) {
    throw new RebalancerExplorerBackendError('evaluate', error);
  }
}

/**
 * Evaluate a metric collection for two assignments.
 *
 * Routes the RPC to the server identified in the handle.
 */
export async function evaluateMetricCollection(
  handle: Handle,
  query: Query,
  evaluateRequestA: EvaluateRequest,
  evaluateRequestB: EvaluateRequest,
  catToken?: string,
): Promise<Result> {
  try {
    const rpcClient = await getRpcClient(catToken, {
      ip_addr: handle.host,
      port: handle.port,
    });
    const request: DataRequest = {query};
    const response = await rpcClient.evaluateMetricCollection({
      handle,
      request,
      evaluateRequestA,
      evaluateRequestB,
    });
    return response as Result;
  } catch (error) {
    throw new RebalancerExplorerBackendError('evaluateMetricCollection', error);
  }
}

/**
 * Fetch the spec for a given goal (objective) by name.
 *
 * Routes the RPC to the server identified in the handle.
 */
export async function getGoalSpec(
  handle: Handle,
  name: string,
  catToken?: string,
): Promise<GoalSpecResponse> {
  try {
    const rpcClient = await getRpcClient(catToken, {
      ip_addr: handle.host,
      port: handle.port,
    });
    const request: GoalSpecRequest = {name};
    const response = await rpcClient.getGoalSpecV2({handle, request});
    return response as GoalSpecResponse;
  } catch (error) {
    throw new RebalancerExplorerBackendError('getGoalSpec', error);
  }
}

/**
 * Fetch the spec for a given constraint by name.
 *
 * Routes the RPC to the server identified in the handle.
 */
export async function getConstraintSpec(
  handle: Handle,
  name: string,
  catToken?: string,
): Promise<ConstraintSpecResponse> {
  try {
    const rpcClient = await getRpcClient(catToken, {
      ip_addr: handle.host,
      port: handle.port,
    });
    const request: ConstraintSpecRequest = {name};
    const response = await rpcClient.getConstraintSpecV2({handle, request});
    return response as ConstraintSpecResponse;
  } catch (error) {
    throw new RebalancerExplorerBackendError('getConstraintSpec', error);
  }
}
