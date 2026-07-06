// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#include "rebalancer/explorer/client/cpp/ServerSelection.h"

#include <gtest/gtest.h>

using namespace facebook::rebalancer::explorer;
using facebook::rebalancer::explorer::client::selectBestServer;
using facebook::rebalancer::explorer::client::ServerAddr;

namespace {

ServerStatus makeStatus(int64_t loading, int64_t freeBytes) {
  ServerStatus status;
  status.loadingSandboxCount() = loading;
  status.loadedSandboxCount() = 0;
  status.freeMemoryBytes() = freeBytes;
  status.usedMemoryBytes() = 0;
  return status;
}

const std::vector<ServerAddr> kAddrs{
    ServerAddr{.host = "a", .port = 1},
    ServerAddr{.host = "b", .port = 2},
    ServerAddr{.host = "c", .port = 3},
};

bool sameAddr(const ServerAddr& lhs, const ServerAddr& rhs) {
  return lhs.host == rhs.host && lhs.port == rhs.port;
}

} // namespace

TEST(ServerSelectionTest, PicksFewestLoading) {
  const std::vector<std::optional<ServerStatus>> statuses{
      makeStatus(3, 100), makeStatus(1, 10), makeStatus(2, 100)};
  const auto best = selectBestServer(statuses, kAddrs);
  ASSERT_TRUE(best.has_value());
  EXPECT_TRUE(sameAddr(ServerAddr{.host = "b", .port = 2}, *best));
}

TEST(ServerSelectionTest, TiesBrokenByMostFreeMemory) {
  const std::vector<std::optional<ServerStatus>> statuses{
      makeStatus(1, 50), makeStatus(1, 300), makeStatus(1, 100)};
  const auto best = selectBestServer(statuses, kAddrs);
  ASSERT_TRUE(best.has_value());
  EXPECT_TRUE(sameAddr(ServerAddr{.host = "b", .port = 2}, *best));
}

TEST(ServerSelectionTest, SkipsUnreachableServers) {
  const std::vector<std::optional<ServerStatus>> statuses{
      std::nullopt, makeStatus(5, 100), std::nullopt};
  const auto best = selectBestServer(statuses, kAddrs);
  ASSERT_TRUE(best.has_value());
  EXPECT_TRUE(sameAddr(ServerAddr{.host = "b", .port = 2}, *best));
}

TEST(ServerSelectionTest, ReturnsNulloptWhenAllUnreachable) {
  const std::vector<std::optional<ServerStatus>> statuses{
      std::nullopt, std::nullopt, std::nullopt};
  EXPECT_FALSE(selectBestServer(statuses, kAddrs).has_value());
}

TEST(ServerSelectionTest, ReturnsNulloptForEmpty) {
  EXPECT_FALSE(selectBestServer({}, {}).has_value());
}
