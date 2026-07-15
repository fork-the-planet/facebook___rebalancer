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
  // Several scope items are explored in parallel; per-destination seeding makes
  // the chosen move identical on every run and race-free (checked under
  // dev-tsan).
  constexpr int kSampleRuns = 100;
  setInitialAssignment(
      {{"container0", {"object0", "object1"}},
       {"container1", {}},
       {"container2", {}},
       {"container3", {}},
       {"container4", {}},
       {"container5", {}},
       {"container6", {}}});
  co_await addScope(
      "assignable",
      {{"item0", {"container1", "container2"}},
       {"item1", {"container3", "container4"}},
       {"item2", {"container5", "container6"}}});
  co_await addPartition("job", {{"j1", {"object0", "object1"}}});
  const auto universe = buildUniverse();

  createProblem(
      /*objectiveTuple=*/{const_expr(0, *universe)},
      /*constraint=*/const_expr(0, *universe));

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
  const std::vector<Move> expectedMoves(expected.begin(), expected.end());
  for ([[maybe_unused]] const auto i : folly::irange(kSampleRuns)) {
    REBALANCER_EXPECT_EQ_MOVESETS(expectedMoves, sampleGroupMove());
  }
}

} // namespace facebook::rebalancer::packer::tests
