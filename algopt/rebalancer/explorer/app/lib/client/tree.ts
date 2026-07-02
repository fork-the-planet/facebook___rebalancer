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
 * Expression-tree node fetching plus the helpers that flatten the
 * Thrift `ExpressionProperties` wrapper into the array shape the
 * frontend consumes.
 */

import type {
  ExpressionProperty,
  ExpressionPropertyValue,
  Handle,
  TreeNode,
  TreeNodeRequest,
  TreeNodeResponse,
} from '../rebalancer-explorer-types';
import {getRpcClient, RebalancerExplorerBackendError} from './core';

/**
 * Convert the Thrift ExpressionProperties struct (a wrapper around
 * `map<string, ExpressionPropertyValue>`) into the flat
 * `ExpressionProperty[]` array the frontend expects.
 *
 * The Thrift wire format is:
 *   { properties: { "feasibility_tolerance": { valueDouble: { value: 0.01 } }, ... } }
 *
 * We transform it to:
 *   [ { name: "Feasibility tolerance", value: { valueDouble: { value: 0.01 } } }, ... ]
 */
function parseExpressionProperties(
  raw: unknown,
): ExpressionProperty[] | undefined {
  if (raw == null || typeof raw !== 'object') {
    return undefined;
  }

  // Unwrap the ExpressionProperties wrapper struct
  const map =
    'properties' in raw &&
    raw.properties != null &&
    typeof raw.properties === 'object' &&
    !Array.isArray(raw.properties)
      ? (raw.properties as Record<string, ExpressionPropertyValue>)
      : null;

  if (map == null) {
    // Already an array (unexpected but handle gracefully)
    if (Array.isArray(raw)) {
      return raw as ExpressionProperty[];
    }
    return undefined;
  }

  return Object.entries(map).map(([key, value]) => ({
    name: formatPropertyName(key),
    value: value as ExpressionPropertyValue,
  }));
}

/**
 * Format a snake_case property name into a human-readable label.
 * e.g. "feasibility_tolerance" → "Feasibility tolerance"
 */
function formatPropertyName(input: string): string {
  if (input.length === 0) {
    return input;
  }
  return (
    input.charAt(0).toUpperCase() + input.slice(1).toLowerCase()
  ).replaceAll('_', ' ');
}

/**
 * Transform a raw Thrift TreeNode response, converting the
 * ExpressionProperties wrapper struct into a flat array.
 */
function transformTreeNode(raw: Record<string, unknown>): TreeNode {
  return {
    ...raw,
    properties: parseExpressionProperties(raw.properties),
  } as TreeNode;
}

/**
 * Fetch a tree node and its children for the expression tree.
 *
 * Routes the RPC to the server identified in the handle.
 */
export async function getTreeNode(
  handle: Handle,
  request: TreeNodeRequest,
  catToken?: string,
): Promise<TreeNodeResponse> {
  try {
    const rpcClient = await getRpcClient(catToken, {
      ip_addr: handle.host,
      port: handle.port,
    });
    const response = await rpcClient.getTreeNodeV2({handle, request});
    const raw = response as {
      node: Record<string, unknown>;
      children: Record<string, unknown>[];
    };
    return {
      node: transformTreeNode(raw.node),
      children: raw.children.map(transformTreeNode),
    };
  } catch (error) {
    throw new RebalancerExplorerBackendError('getTreeNode', error);
  }
}
