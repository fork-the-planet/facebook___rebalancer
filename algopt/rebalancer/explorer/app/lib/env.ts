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
 * Environment detection utilities for the RebalancerExplorer app.
 */

/**
 * Returns true when running in a Meta-internal environment where SMC
 * tier discovery, sticky routing, and related infrastructure are available.
 *
 * When REBALANCER_HOST or REBALANCER_PROXY_URL is set, the app is running in
 * OSS / local-dev mode against a single, known backend (directly or via the
 * JSON proxy) — SMC tier discovery is not available.
 */
export function shouldUseSMC(): boolean {
  return !process.env.REBALANCER_HOST && !process.env.REBALANCER_PROXY_URL;
}
