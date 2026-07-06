// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#include "algopt/rebalancer/solver/expressions/Operators.h"
#include "algopt/rebalancer/solver/moves/GreedyGroupToScopeItemMoveType.h"
#include "algopt/rebalancer/solver/moves/tests/MoveTestBase.h"

#include <fmt/format.h>
#include <folly/container/irange.h>
#include <folly/coro/GtestHelpers.h>
#include <gtest/gtest.h>

#include <string>
#include <vector>

namespace facebook::rebalancer::packer::tests {

class GreedyGroupToScopeItemMoveTypeTest : public MoveTestBase {
 protected:
  GreedyGroupToScopeItemMoveTypeTest() : MoveTestBase("object", "container") {}
};

CO_TEST_F(GreedyGroupToScopeItemMoveTypeTest, SamplingIsDeterministic) {
  // Freshly constructed move types share the same default-seeded rng_, so every
  // sample picks the same containers.
  constexpr int kGroupSize = 2;
  // Enough empty candidates that a random shuffle almost never picks the same
  // pair twice.
  constexpr int kCandidateCount = 12;
  constexpr int kSampleRuns = 100;

  // The group starts together on container0 (the hot container); container1..N
  // are empty candidates, so the sampled pair depends only on the shuffle
  // order.
  std::vector<std::string> groupObjects;
  groupObjects.reserve(kGroupSize);
  for (const auto i : folly::irange(kGroupSize)) {
    groupObjects.push_back(fmt::format("object{}", i));
  }
  entities::Map<std::string, std::vector<std::string>> assignment{
      {"container0", groupObjects}};
  std::vector<std::string> candidates;
  candidates.reserve(kCandidateCount);
  for (const auto i : folly::irange(1, kCandidateCount + 1)) {
    const auto name = fmt::format("container{}", i);
    assignment[name] = {};
    candidates.push_back(name);
  }
  setInitialAssignment(assignment);
  co_await addScope("assignable", {{"candidates", candidates}});
  co_await addPartition("job", {{"j1", groupObjects}});
  const auto universe = buildUniverse();

  createProblem(
      /*objectiveTuple=*/{const_expr(0, *universe)},
      /*constraint=*/const_expr(0, *universe));

  // One sample of the group's destinations from a fresh, default-seeded move.
  const auto sampleGroupMove = [&] {
    interface::GreedyGroupToScopeItemMoveTypeSpec spec;
    spec.groupMovesPartition() = "job";
    spec.scopeItemMovesScope() = "assignable";
    spec.nSampleSetsToExplore() = 1;
    return GreedyGroupToScopeItemMoveType(
               interface::LocalSearchSolverSpec{}, spec)
        .findBestMove(
            getMovesEvaluator(),
            /*hotContainer=*/container(0),
            getMoveStatsAggregator(),
            getEmptySearchHints(),
            std::numeric_limits<double>::max())
        .getMoveSet();
  };

  const auto expected = sampleGroupMove();
  CO_ASSERT_EQ(static_cast<int>(expected.size()), kGroupSize);
  const std::vector<Move> expectedMoves(expected.begin(), expected.end());
  for ([[maybe_unused]] const auto i : folly::irange(kSampleRuns)) {
    REBALANCER_EXPECT_EQ_MOVESETS(expectedMoves, sampleGroupMove());
  }
}

} // namespace facebook::rebalancer::packer::tests
