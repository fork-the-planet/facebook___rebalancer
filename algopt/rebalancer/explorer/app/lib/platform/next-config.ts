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
 * OSS Next.js base config — replaces @nest/next-core's baseConfig.
 *
 * Intentionally minimal: the internal baseConfig carries Meta-specific build
 * tweaks that don't apply outside fbsource. Add OSS-wide Next.js defaults here as
 * needed. The internal adapter (lib/platform/fb/next-config.ts) re-exports
 * @nest/next-core's baseConfig.
 */

import type {NextConfig} from 'next';

export const baseConfig: NextConfig = {};
