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
 * OSS telemetry adapter — no-op.
 *
 * The internal adapter wires @nest/otel. OpenTelemetry export can be added here
 * via @opentelemetry/sdk-node if a self-hoster wants it (the OTEL_* env vars in
 * .env are already shaped for an OTLP collector).
 */

export async function register(): Promise<void> {
  // Intentionally a no-op in the OSS build.
}
