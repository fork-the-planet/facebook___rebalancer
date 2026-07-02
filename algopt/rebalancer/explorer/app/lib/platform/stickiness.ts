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
 * OSS stickiness adapter.
 *
 * The OSS build reaches a single backend through the JSON proxy (see
 * lib/platform/transport.ts), so there is no server fleet to probe or pin to —
 * handle resolution is a plain getHandle. The internal counterpart at
 * lib/platform/fb/stickiness.ts implements SMC tier discovery + sticky routing
 * and is selected at build time when NEST_INTERNAL=1 (see next.config.ts).
 */

import type {HandleResponse} from '../rebalancer-explorer-types';
import {getHandle} from '../client/handle';

export function getHandleSticky(
  manifoldId: string,
  catToken?: string,
): Promise<HandleResponse> {
  return getHandle(manifoldId, catToken);
}
