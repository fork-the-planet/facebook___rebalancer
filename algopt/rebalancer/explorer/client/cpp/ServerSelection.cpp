// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#include "rebalancer/explorer/client/cpp/ServerSelection.h"

#include "rebalancer/explorer/if/gen-cpp2/RebalancerExplorerService.h"

#include <servicerouter/client/cpp2/ServiceRouter.h>

#include <folly/coro/Collect.h>
#include <folly/logging/xlog.h>

#include <chrono>

namespace facebook::rebalancer::explorer::client {

namespace {

using RebalancerClient = apache::thrift::Client<RebalancerExplorerService>;

// Priorities returned by the already-loaded probe (higher is better).
constexpr int kPriorityLoaded = 2;
constexpr int kPriorityExists = 1;
constexpr int kPriorityNone = 0;

std::unique_ptr<RebalancerClient>
pinnedClient(const std::string& tier, const ServerAddr& addr, int timeoutMs) {
  servicerouter::ClientParams params;
  params.setProcessingTimeoutMs(std::chrono::milliseconds(timeoutMs));
  params.setSingleHost(addr.host, addr.port);
  return servicerouter::cpp2::getClientFactory()
      .getSRClientUnique<RebalancerClient>(tier, params);
}

// Query one server's load, returning std::nullopt if it is unreachable.
folly::coro::Task<std::optional<ServerStatus>>
probeStatus(std::string tier, ServerAddr addr, int timeoutMs) {
  try {
    auto client = pinnedClient(tier, addr, timeoutMs);
    co_return co_await client->co_getServerStatus();
  } catch (const std::exception& e) {
    XLOG(DBG2) << "getServerStatus failed for " << addr.host << ":" << addr.port
               << ": " << e.what();
    co_return std::nullopt;
  }
}

// Rank a server for a manifoldId by its sandbox status: 2 = already loaded,
// 1 = exists but loading/errored, 0 = not loaded or unreachable.
folly::coro::Task<int> probePriority(
    std::string tier,
    ServerAddr addr,
    std::string manifoldId,
    int timeoutMs) {
  try {
    auto client = pinnedClient(tier, addr, timeoutMs);
    Handle handle;
    handle.manifoldId() = manifoldId;
    auto response = co_await client->co_getSandboxStatus(handle);
    switch (*response.status()) {
      case SandboxStatus::NOT_LOADED:
        co_return kPriorityNone;
      case SandboxStatus::LOADED:
        co_return kPriorityLoaded;
      case SandboxStatus::LOADING:
        co_return kPriorityExists;
    }
    co_return kPriorityExists;
  } catch (const std::exception& e) {
    XLOG(DBG2) << "getSandboxStatus failed for " << addr.host << ":"
               << addr.port << ": " << e.what();
    co_return kPriorityNone;
  }
}

std::vector<ServerAddr> discoverServers(const std::string& tier) {
  std::vector<ServerAddr> addrs;
  try {
    servicerouter::SelectionParams params;
    params.selectAllHosts();
    params.preferGlobalHosts();
    auto hosts =
        servicerouter::cpp2::getClientFactory().getSelection(tier, params);
    addrs.reserve(hosts.size());
    for (const auto& host : hosts) {
      addrs.push_back(ServerAddr{.host = host.getIp(), .port = host.getPort()});
    }
  } catch (const std::exception& e) {
    XLOG(WARNING) << "Failed to discover hosts for tier " << tier << ": "
                  << e.what();
  }
  return addrs;
}

folly::coro::Task<std::optional<ServerAddr>> findAlreadyLoaded(
    const std::string& tier,
    const std::vector<ServerAddr>& addrs,
    const std::string& manifoldId,
    int timeoutMs) {
  std::vector<folly::coro::Task<int>> tasks;
  tasks.reserve(addrs.size());
  for (const auto& addr : addrs) {
    tasks.push_back(probePriority(tier, addr, manifoldId, timeoutMs));
  }
  auto priorities = co_await folly::coro::collectAllRange(std::move(tasks));

  std::optional<ServerAddr> best;
  int bestPriority = kPriorityNone;
  for (size_t i = 0; i < priorities.size(); ++i) {
    if (priorities[i] > bestPriority) {
      bestPriority = priorities[i];
      best = addrs[i];
    }
  }
  co_return best;
}

} // namespace

std::optional<ServerAddr> selectBestServer(
    const std::vector<std::optional<ServerStatus>>& statuses,
    const std::vector<ServerAddr>& addrs) {
  std::optional<ServerAddr> best;
  int64_t bestLoading = 0;
  int64_t bestMemory = 0;
  for (size_t i = 0; i < statuses.size() && i < addrs.size(); ++i) {
    const auto& status = statuses[i];
    if (!status.has_value()) {
      continue;
    }
    const int64_t loading = *status->loadingSandboxCount();
    const int64_t memory = *status->freeMemoryBytes();
    if (!best.has_value() || loading < bestLoading ||
        (loading == bestLoading && memory > bestMemory)) {
      best = addrs[i];
      bestLoading = loading;
      bestMemory = memory;
    }
  }
  return best;
}

folly::coro::Task<std::optional<ServerAddr>> resolveTargetServer(
    std::string tier,
    std::optional<std::string> manifoldId,
    int timeoutMs) {
  const auto addrs = discoverServers(tier);
  if (addrs.empty()) {
    co_return std::nullopt;
  }

  if (manifoldId.has_value()) {
    auto loaded =
        co_await findAlreadyLoaded(tier, addrs, *manifoldId, timeoutMs);
    if (loaded.has_value()) {
      co_return loaded;
    }
  }

  std::vector<folly::coro::Task<std::optional<ServerStatus>>> tasks;
  tasks.reserve(addrs.size());
  for (const auto& addr : addrs) {
    tasks.push_back(probeStatus(tier, addr, timeoutMs));
  }
  auto statuses = co_await folly::coro::collectAllRange(std::move(tasks));
  co_return selectBestServer(statuses, addrs);
}

} // namespace facebook::rebalancer::explorer::client
