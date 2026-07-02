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

'use client';

/**
 * @format
 *
 * OSS stub for the Rebalancer Assistant UI.
 *
 * The assistant wraps the internal Metamate EPS chat, which has no OSS
 * counterpart, so the whole feature is excluded from the OSS export: the real
 * component lives under app/components/fb/ (stripped by ShipIt) and is reached
 * via lib/platform/fb/assistant-ui.tsx when NEST_INTERNAL=1. Externally this
 * stub stands in. ASSISTANT_ENABLED is false, so call sites (e.g. the sidebar
 * entry) never surface it; if rendered it draws nothing.
 */

import type {ReactElement} from 'react';

export const ASSISTANT_ENABLED: boolean = false;

export function RebalancerExplorerAssistant(): ReactElement | null {
  return null;
}
