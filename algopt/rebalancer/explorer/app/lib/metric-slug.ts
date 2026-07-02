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
 * Slugify a metric collection name for use in URL paths. Replaces whitespace
 * with hyphens because nest-dev-proxy's underlying hyper Uri parser rejects
 * literal whitespace, and percent-decoded `%20` ends up as a literal space in
 * the proxy pipeline.
 *
 * Round-trip via {@link findMetricNameBySlug} against the canonical
 * `metricCollectionNames` list from problem metadata.
 */
export function slugifyMetricName(name: string): string {
  return name.trim().replace(/\s+/g, '-');
}

export function findMetricNameBySlug(
  slug: string,
  names: readonly string[],
): string | null {
  return names.find(n => slugifyMetricName(n) === slug) ?? null;
}
