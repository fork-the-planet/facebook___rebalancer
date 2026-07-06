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
 * Core client plumbing for the RebalancerExplorerService.
 *
 * Holds service-tier constants, the RPC client factory (which delegates to the
 * build-selected @platform/transport — Thrift internally, HTTP/JSON externally),
 * error normalization, and CAT token extraction. RPC method wrappers live in
 * sibling files in this directory.
 */

import {getRpcClient as getTransportRpcClient} from '@platform/transport';

// Service configuration
const REBALANCER_SERVICE_TIER = 'rebalancer_explorer';
const REBALANCER_SERVICE_NAME = 'RebalancerExplorerService';

// Shared RPC options for every RebalancerExplorerService call. Timeouts are 600s
// (10 min) to match the ServiceRouter config in D106090726; large runs can take
// several minutes to evaluate. One source of truth so the eval RPC and the
// getHandle server-selection call can't drift apart.
export const REBALANCER_RPC_OPTIONS = {
  processing_timeout_ms: 600000,
  overall_timeout_ms: 600000,
  client_id: 'rebalancer_explorer_nest',
} as const;

// Host override for OSS / local development
const REBALANCER_HOST = process.env.REBALANCER_HOST ?? null;
const REBALANCER_PORT = process.env.REBALANCER_PORT
  ? parseInt(process.env.REBALANCER_PORT, 10)
  : null;

/**
 * Custom error class that captures backend error details
 */
export class RebalancerExplorerBackendError extends Error {
  public readonly backendError: string;
  public readonly operation: string;
  public readonly originalError: unknown;

  constructor(operation: string, error: unknown) {
    const backendError = extractBackendError(error);
    super(`RebalancerExplorer backend error in ${operation}: ${backendError}`);
    this.name = 'RebalancerExplorerBackendError';
    this.operation = operation;
    this.backendError = backendError;
    this.originalError = error;
  }
}

/**
 * Extract meaningful error information from Thrift/backend errors
 */
function extractBackendError(error: unknown): string {
  if (error instanceof Error) {
    const thriftError = error as Error & {
      message?: string;
      reason?: string;
      code?: string | number;
      details?: string;
      exceptionMessage?: string;
    };

    const parts: string[] = [];

    if (thriftError.exceptionMessage) {
      parts.push(thriftError.exceptionMessage);
    }
    if (thriftError.reason) {
      parts.push(`reason: ${thriftError.reason}`);
    }
    if (thriftError.code !== undefined) {
      parts.push(`code: ${thriftError.code}`);
    }
    if (thriftError.details) {
      parts.push(`details: ${thriftError.details}`);
    }
    if (parts.length === 0) {
      parts.push(thriftError.message);
    }

    return parts.join('; ');
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Extract the CAT token from a Bearer Authorization header.
 */
export function extractCatToken(request: Request): string | undefined {
  const authHeader = request.headers.get('authorization');
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
}

// ============ RPC Client ============

/**
 * Get an RPC client for the RebalancerExplorerService.
 *
 * The transport is selected at build time via the @platform seam: internally
 * (NEST_INTERNAL=1) it's ThriftProxyClient over ServiceRouter; externally it's
 * the HTTP/JSON client for the C++ proxy. `host_override` and `cat` are honored
 * by the internal transport and ignored by the OSS transport.
 *
 * @param catToken - Optional CAT token for authentication (internal only)
 * @param hostOverride - Optional host override to pin the RPC to a specific server
 */
export async function getRpcClient(
  catToken?: string,
  hostOverride?: {ip_addr: string; port: number},
) {
  const options: Record<string, unknown> = {...REBALANCER_RPC_OPTIONS};

  if (hostOverride) {
    options.host_override = hostOverride;
  } else if (REBALANCER_HOST && REBALANCER_PORT) {
    options.host_override = {
      ip_addr: REBALANCER_HOST,
      port: REBALANCER_PORT,
    };
  }

  if (catToken) {
    options.cat = catToken;
  }

  return getTransportRpcClient(
    REBALANCER_SERVICE_TIER,
    REBALANCER_SERVICE_NAME,
    options,
  );
}
