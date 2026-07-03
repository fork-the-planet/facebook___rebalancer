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
 * OSS stub for links to internal Meta tools (Tupperware, Metamate, Thrift
 * Explorer, internal wikis, Workplace). Those targets don't exist externally,
 * so every builder returns null and call sites skip rendering the link. The
 * internal URLs live in lib/platform/fb/internal-links.ts, which ShipIt strips
 * from the OSS export; this stub is what ships.
 */

export const INTERNAL_LINKS_ENABLED = false;

export function internalExplorerUrl(_runId: string): string | null {
  return null;
}

export function thriftExplorerUrl(_encodedRunId: string): string | null {
  return null;
}

export function metamateConversationUrl(_conversationId: string): string | null {
  return null;
}

export function tupperwareTaskLink(
  _taskId: number,
): {href: string; label: string} | null {
  return null;
}

export function rebalancerWikiUrl(): string | null {
  return null;
}

export function rebalancerDocsUrl(): string | null {
  return null;
}

export function rebalancerWorkplaceUrl(): string | null {
  return null;
}

export function metricsFaqUrl(): string | null {
  return null;
}
