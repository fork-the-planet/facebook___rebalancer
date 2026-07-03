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
 * Run ID (manifoldId) URL-encoding helpers.
 *
 * A run id can contain slashes — e.g. "/bundles/eightqueens.bundle" or
 * "rebalancer/flat/solver_run_123" — so it is percent-encoded into a single
 * dynamic route segment (`/run/[runId]`). Next returns route params still
 * percent-encoded, and passing an already-encoded segment back through
 * `router.push` / link hrefs can re-encode it ("%2F" → "%252F"). Centralizing
 * encode/decode here keeps the invariant simple:
 *
 *   real id  --encodeRunId-->  route segment  --(Next)-->  params.runId
 *   params.runId  --decodeRunId-->  real id (use this as the manifoldId)
 *
 * Always `decodeRunId(params.runId)` to recover the real id, and `encodeRunId`
 * to build a segment — never `encodeURIComponent(params.runId)` directly, which
 * double-encodes.
 */

/**
 * Recover the real run id from a (possibly multiply) percent-encoded route
 * segment. Decodes repeatedly until stable, tolerating accidental
 * double-encoding introduced during navigation.
 */
export function decodeRunId(raw: string): string {
  let value = raw;
  // Run ids are Manifold-style paths with no literal '%', so decoding until the
  // string stops changing is safe. The cap is just a guard against pathological
  // input.
  for (let i = 0; i < 5; i++) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(value);
    } catch {
      return value;
    }
    if (decoded === value) {
      break;
    }
    value = decoded;
  }
  return value;
}

/** Encode a real run id into a single canonical route segment. */
export function encodeRunId(runId: string): string {
  return encodeURIComponent(runId);
}
