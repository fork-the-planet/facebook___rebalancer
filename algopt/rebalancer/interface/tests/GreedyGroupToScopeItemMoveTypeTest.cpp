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

#include "algopt/rebalancer/algopt_common/TestUtils.h"
#include "algopt/rebalancer/interface/tests/utils.h"
#include <algopt/rebalancer/interface/thrift/gen-cpp2/ProblemSpecs_types.h>

#include <gtest/gtest.h>

using namespace facebook::rebalancer::interface;

class GreedyGroupToScopeItemTest : public ::testing::TestWithParam<int> {
 protected:
  void SetUp() override {
    solver_ = initializeTestProblemSolver({.executorThreadCount = GetParam()});
    solver_->setObjectName("task");
    solver_->setContainerName("host");
    solver_->setAssignment(
        folly::F14FastMap<std::string, std::vector<std::string>>{
            {"unassigned", {"task0", "task1", "task2", "task3"}},
            {"host1", {"task4"}},
            {"host2", {}},
            {"host3", {}}});

    solver_->addPartition(
        "job",
        std::map<std::string, std::vector<std::string>>({
            {"job0", {"task0", "task1", "task3"}},
        }));

    solver_->addScope(
        "assignable",
        std::map<std::string, std::string>({
            {"host1", "assignable1"},
            {"host2", "assignable1"},
            {"host3", "assignable1"},
        }));
  }

  std::unique_ptr<ProblemSolver> solver_;
};

INSTANTIATE_TEST_CASE_P(
    NumThreads,
    GreedyGroupToScopeItemTest,
    testThreadCounts());

TEST_P(GreedyGroupToScopeItemTest, Basic) {
  // problem is setup in SetUp()
  {
    ToFreeSpec spec;
    spec.containers() = {"unassigned"};
    solver_->addConstraint(spec);
  }

  {
    // NOTE: GreedyGroupToScopeItem forces every object in the given group to a
    // *unique* container in the scopeItem.
    LocalSearchSolverSpec spec;
    GreedyGroupToScopeItemMoveTypeSpec moveTypeSpec;
    moveTypeSpec.scopeItemMovesScope() = "assignable";
    moveTypeSpec.groupMovesPartition() = "job";
    spec.moveTypeList()->push_back(
        ProblemSolver::makeMoveTypeSpec(std::move(moveTypeSpec)));

    solver_->addSolver(spec);
  }

  auto solution = solver_->solve();
  auto& assignment = *solution.assignment();

  // Expect tasks 0, 1, and 3 to move to one of host1/host2/host3, so they
  // cannot be in 'unassigned'
  EXPECT_NE(assignment["task0"], "unassigned");
  EXPECT_NE(assignment["task1"], "unassigned");
  EXPECT_NE(assignment["task3"], "unassigned");
}

TEST_P(GreedyGroupToScopeItemTest, RejectsInvalidSpecs) {
  // A rejected spec throws in checkSolverSpec before any solver is added, so
  // solver_ stays usable across cases.
  const auto expectRejected =
      [&](GreedyGroupToScopeItemMoveTypeSpec moveTypeSpec,
          const std::string& error) {
        LocalSearchSolverSpec spec;
        spec.moveTypeList()->push_back(
            ProblemSolver::makeMoveTypeSpec(std::move(moveTypeSpec)));
        REBALANCER_EXPECT_RUNTIME_ERROR(solver_->addSolver(spec), error);
      };

  ScopeItemList item;
  item.scopeName() = "assignable";
  item.scopeItems() = {"assignable1"};

  // Neither scopeItemMovesScope nor destinationsToExplore set: no destinations.
  expectRejected(
      GreedyGroupToScopeItemMoveTypeSpec(),
      "GreedyGroupToScopeItemMoveTypeSpec must have at least one of 'scopeItemMovesScope' or 'destinationsToExplore' set");

  // Destinations configured but no group partition.
  {
    GreedyGroupToScopeItemMoveTypeSpec moveTypeSpec;
    moveTypeSpec.scopeItemMovesScope() = "assignable";
    expectRejected(
        std::move(moveTypeSpec),
        "GreedyGroupToScopeItemMoveTypeSpec requires 'groupMovesPartition' to be set");
  }

  // objectToScopeItems is per-object, ambiguous for a whole-group move.
  {
    MoveToScopeItemsSpec moveToScopeItems;
    moveToScopeItems.defaultScopeItems() = item;
    moveToScopeItems.objectToScopeItems() = {{"task0", item}};
    DestinationsToExploreOptions destinationsToExplore;
    destinationsToExplore.moveToScopeItems() = moveToScopeItems;
    GreedyGroupToScopeItemMoveTypeSpec moveTypeSpec;
    moveTypeSpec.groupMovesPartition() = "job";
    moveTypeSpec.destinationsToExplore() = destinationsToExplore;
    expectRejected(
        std::move(moveTypeSpec),
        "GreedyGroupToScopeItemMoveTypeSpec does not support 'objectToScopeItems' in 'destinationsToExplore'; it moves a whole group to one scope item. Use 'scopeItemsPerGroups' or 'defaultScopeItems' instead");
  }

  // scopeItemsPerGroups must resolve groups from the same partition we move.
  {
    GroupToScopeItemList perGroup;
    perGroup.partitionName() = "other";
    perGroup.groupToScopeItemList() = {{"job0", item}};
    MoveToScopeItemsSpec moveToScopeItems;
    moveToScopeItems.defaultScopeItems() = item;
    moveToScopeItems.scopeItemsPerGroups() = perGroup;
    DestinationsToExploreOptions destinationsToExplore;
    destinationsToExplore.moveToScopeItems() = moveToScopeItems;
    GreedyGroupToScopeItemMoveTypeSpec moveTypeSpec;
    moveTypeSpec.groupMovesPartition() = "job";
    moveTypeSpec.destinationsToExplore() = destinationsToExplore;
    expectRejected(
        std::move(moveTypeSpec),
        "GreedyGroupToScopeItemMoveTypeSpec 'scopeItemsPerGroups' partition 'other' must match 'groupMovesPartition' 'job'");
  }
}

TEST_P(GreedyGroupToScopeItemTest, PruningSkipsFullHostButKeepsHostWithRoom) {
  // task0 (1 gpu) starts in 'unassigned', which a ToFree constraint drains, so
  // it must move. Scope 'rack' has two hosts, each its own scope item: 'full'
  // (holds 2 tasks, already at the per-host cap of 2 gpu) and 'partial' (holds
  // 1 task, room for one more). task0 fits only on 'partial'; the full host
  // would overflow, so pruning drops it before it is evaluated.
  // `pruneFullHost` toggles candidatePruning.
  const auto solve = [&](bool pruneFullHost) {
    auto solver =
        initializeTestProblemSolver({.executorThreadCount = GetParam()});
    solver->setObjectName("task");
    solver->setContainerName("host");
    solver->setAssignment(
        folly::F14FastMap<std::string, std::vector<std::string>>{
            {"unassigned", {"task0"}},
            {"full", {"task1", "task2"}},
            {"partial", {"task3"}}});
    solver->addPartition(
        "solo",
        std::map<std::string, std::vector<std::string>>(
            {{"solo0", {"task0"}}}));
    solver->addScope(
        "rack",
        std::map<std::string, std::string>(
            {{"full", "rack1"}, {"partial", "rack2"}}));
    solver->addObjectDimension(
        "gpu",
        std::map<std::string, double>(
            {{"task0", 1}, {"task1", 1}, {"task2", 1}, {"task3", 1}}));

    CapacitySpec capacitySpec;
    capacitySpec.name() = "host_gpu_capacity";
    capacitySpec.scope() = "host";
    capacitySpec.dimension() = "gpu";
    capacitySpec.bound() = CapacitySpecBound::MAX;
    Limit limit;
    limit.type() = LimitType::ABSOLUTE;
    limit.globalLimit() = 2;
    capacitySpec.limit() = std::move(limit);
    solver->addConstraint(capacitySpec);

    {
      // Drain 'unassigned' so task0 has to move.
      ToFreeSpec spec;
      spec.containers() = {"unassigned"};
      solver->addConstraint(spec);
    }

    GreedyGroupToScopeItemMoveTypeSpec moveTypeSpec;
    moveTypeSpec.scopeItemMovesScope() = "rack";
    moveTypeSpec.groupMovesPartition() = "solo";
    moveTypeSpec.nSampleSetsToExplore() = 1;
    if (pruneFullHost) {
      moveTypeSpec.candidatePruning()->constraintNames() = {
          "host_gpu_capacity"};
    }
    LocalSearchSolverSpec spec;
    spec.moveTypeList()->push_back(
        ProblemSolver::makeMoveTypeSpec(std::move(moveTypeSpec)));
    solver->addSolver(spec);
    return solver->solve();
  };

  const auto numEvals = [](const AssignmentSolution& solution) {
    auto evalStats = solution.solverSummaries()->at(0).evalStats();
    if (!evalStats.has_value()) {
      throw std::runtime_error("expected solver eval stats to be populated");
    }
    return *evalStats->numEvals();
  };

  const auto pruned = solve(/*pruneFullHost=*/true);
  const auto unpruned = solve(/*pruneFullHost=*/false);

  // task0 fits only on 'partial', so it lands there with or without pruning.
  EXPECT_EQ(pruned.assignment()->at("task0"), "partial");
  EXPECT_EQ(unpruned.assignment()->at("task0"), "partial");

  // 'rack' has two scope items (the full host and the host with room), so the
  // unpruned solve evaluates one candidate for each. Pruning drops the full
  // host before evaluation, leaving only the host with room.
  EXPECT_EQ(2, numEvals(unpruned));
  EXPECT_EQ(1, numEvals(pruned));
}
