// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#pragma once

#include "rebalancer/explorer/if/gen-cpp2/explorer_types.h"

#include <folly/coro/Task.h>

#include <optional>
#include <string>
#include <vector>

namespace facebook::rebalancer::explorer::client {

// Default SMC tier for the RebalancerExplorer service.
inline constexpr std::string_view kSmcTier = "rebalancer_explorer";
// Short timeout for status probes: an unresponsive server should be skipped,
// not block handle resolution.
inline constexpr int kStatusTimeoutMs = 1000;

// A single RebalancerExplorer server address.
struct ServerAddr {
  std::string host;
  int32_t port{};
};

// Pick the least-loaded server: fewest actively loading sandboxes, tie-broken
// by most free memory. `statuses` is aligned with `addrs`; a `std::nullopt`
// entry marks an unreachable server and is skipped. Returns `std::nullopt` if
// no server reported its status.
//
// Pure function over already-collected statuses so it can be unit-tested
// without any RPC.
std::optional<ServerAddr> selectBestServer(
    const std::vector<std::optional<ServerStatus>>& statuses,
    const std::vector<ServerAddr>& addrs);

// Resolve the best server to send a `getHandle` call to. Mirrors
// `RebalancerExplorerClientFactory::genFromManifoldId`:
//   1. If `manifoldId` is set, prefer a server that already has the sandbox
//      loaded (cache hit), then one where it is loading/errored.
//   2. Otherwise pick the least-loaded server (see selectBestServer).
//   3. Return `std::nullopt` if discovery fails or no server responds, so the
//      caller falls back to default ServiceRouter routing.
folly::coro::Task<std::optional<ServerAddr>> resolveTargetServer(
    std::string tier = std::string(kSmcTier),
    std::optional<std::string> manifoldId = std::nullopt,
    int timeoutMs = kStatusTimeoutMs);

} // namespace facebook::rebalancer::explorer::client
