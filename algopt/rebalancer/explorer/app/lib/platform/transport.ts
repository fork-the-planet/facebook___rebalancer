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
 *
 * OSS transport adapter.
 *
 * Speaks the Rebalancer Explorer JSON proxy's `POST /v2/<method>` contract
 * (see explorer/proxy/README.md): the request body is a JSON object keyed by the
 * Thrift argument names, and the response body is the JSON-encoded Thrift return
 * value (or `{"error": "..."}` on failure). The objects returned here match the
 * shapes in lib/rebalancer-explorer-types.ts — the same shapes the internal
 * ThriftProxyClient transport returns — so the client layer is identical in both
 * builds.
 *
 * The internal counterpart lives at lib/platform/fb/transport.ts and is
 * selected at build time when NEST_INTERNAL=1 (see next.config.ts).
 */

const PROXY_URL = process.env.REBALANCER_PROXY_URL;
const PROXY_TOKEN = process.env.REBALANCER_PROXY_TOKEN;

const DEFAULT_TIMEOUT_MS = 60000;

export type RpcArgs = Record<string, unknown>;
export type RpcClient = Record<string, (args: RpcArgs) => Promise<unknown>>;

function resolveTimeoutMs(options: Record<string, unknown>): number {
  const overall = options.overall_timeout_ms;
  return typeof overall === 'number' && overall > 0
    ? overall
    : DEFAULT_TIMEOUT_MS;
}

async function callProxy(
  method: string,
  args: RpcArgs,
  timeoutMs: number,
): Promise<unknown> {
  if (!PROXY_URL) {
    throw new Error(
      'REBALANCER_PROXY_URL is not set. The OSS build reaches the backend ' +
        'through the Rebalancer Explorer JSON proxy; set REBALANCER_PROXY_URL ' +
        '(e.g. http://localhost:8081) and, if the proxy enforces auth, ' +
        'REBALANCER_PROXY_TOKEN.',
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {'Content-Type': 'application/json'};
  if (PROXY_TOKEN) {
    headers.Authorization = `Bearer ${PROXY_TOKEN}`;
  }

  try {
    const response = await fetch(
      `${PROXY_URL.replace(/\/+$/, '')}/v2/${method}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(args ?? {}),
        signal: controller.signal,
      },
    );

    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    const errorMessage =
      payload != null && typeof payload === 'object' && 'error' in payload
        ? String((payload as {error: unknown}).error)
        : null;

    if (!response.ok) {
      throw new Error(
        errorMessage ?? `proxy request failed (${response.status})`,
      );
    }

    // A 200 response can still carry an {error} body for backend application errors.
    if (errorMessage != null) {
      throw new Error(errorMessage);
    }

    return payload;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Build an RPC client whose method calls are transcoded to `/v2/<method>`.
 *
 * `serviceTier` / `serviceName` are accepted for parity with the internal
 * transport but unused here: the proxy always dials its single configured,
 * SSRF-safe backend. Likewise `options.host_override` and `options.cat` are
 * ignored — external backend auth is the proxy's static bearer token.
 */
export async function getRpcClient(
  _serviceTier: string,
  _serviceName: string,
  options: Record<string, unknown>,
): Promise<RpcClient> {
  const timeoutMs = resolveTimeoutMs(options);

  return new Proxy({} as RpcClient, {
    get(_target, prop) {
      // Guard against the promise machinery probing for `then` (which would
      // otherwise make this Proxy look thenable) and any symbol access.
      if (typeof prop !== 'string' || prop === 'then') {
        return undefined;
      }
      return (args: RpcArgs) => callProxy(prop, args, timeoutMs);
    },
  });
}
