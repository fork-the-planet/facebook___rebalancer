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
#include "algopt/rebalancer/interface/polyglot/ProblemSolverBinding.h"

#include <gtest/gtest.h>

#include <string>

namespace facebook::rebalancer::binding::tests {

class ProblemSolverBindingTest : public ::testing::Test {
  void SetUp() override {
    solver.setContainerName("container");
    solver.setObjectName("object");
    solver.shouldUseDynamicObjectOrdering(true);
    solver.setAssignment({{"c1", {"o1", "o2"}}, {"c2", {}}});

    solver.addPartition("all objects", {{"o1", {"o1"}}, {"o2", {"o2"}}});
  }

 protected:
  ProblemSolverBinding solver = ProblemSolverBinding("rebalancer", "tests");
};

TEST_F(ProblemSolverBindingTest, EmpyGoalAndConstraintThrows) {
  REBALANCER_EXPECT_RUNTIME_ERROR(
      solver.addGoal(interface::GoalSpecs{}, 1.0, std::nullopt),
      "Thrift union of type 'GoalSpecs' is empty. Please initialize it with a valid type.");

  REBALANCER_EXPECT_RUNTIME_ERROR(
      solver.addConstraint(
          interface::ConstraintSpecs{},
          std::nullopt,
          std::nullopt,
          std::nullopt,
          std::nullopt),
      "Thrift union of type 'ConstraintSpecs' is empty. Please initialize it with a valid type.");
}

TEST_F(ProblemSolverBindingTest, EmpyNameFieldInGoalAndConstraintSpecsThrow) {
  auto solver = ProblemSolverBinding("rebalancer", "tests");

  interface::GoalSpecs goalSpec;
  goalSpec.capacitySpec() = interface::CapacitySpec{};
  REBALANCER_EXPECT_RUNTIME_ERROR(
      solver.addGoal(goalSpec, 1.0, std::nullopt),
      "Expected name field in 'CapacitySpec' to be non-empty");

  interface::ConstraintSpecs constraintSpec;
  constraintSpec.capacitySpec() = interface::CapacitySpec{};
  REBALANCER_EXPECT_RUNTIME_ERROR(
      solver.addConstraint(
          constraintSpec,
          std::nullopt,
          std::nullopt,
          std::nullopt,
          std::nullopt),
      "Expected name field in 'CapacitySpec' to be non-empty");
}

TEST_F(
    ProblemSolverBindingTest,
    SingleParameterConstraintsIgnoreTuplePosIfBroken) {
  // These specs should dispatch to the single-parameter overload even when the
  // binding receives tuplePosIfBroken. Pass a non-nullopt value (-1) to prove
  // the binding ignores it for single-parameter specs rather than forwarding it
  // to the solver.
  {
    interface::AvoidMovingSpec avoidMovingSpec;
    avoidMovingSpec.name() = "avoid_moving spec";
    avoidMovingSpec.objects() = {"o1", "o2"};
    interface::ConstraintSpecs constraintSpec1;
    constraintSpec1.avoidMovingSpec() = avoidMovingSpec;
    solver.addConstraint(
        constraintSpec1, std::nullopt, std::nullopt, std::nullopt, -1);
  }

  {
    interface::MovesInProgressSpec movesInProgressSpec;
    movesInProgressSpec.name() = "movesInProgressSpec";
    movesInProgressSpec.moves() = {};
    interface::ConstraintSpecs constraintSpec2;
    constraintSpec2.movesInProgressSpec() = movesInProgressSpec;
    solver.addConstraint(
        constraintSpec2, std::nullopt, std::nullopt, std::nullopt, -1);
  }
  {
    interface::MoveGroupSpec moveGroupSpec;
    moveGroupSpec.name() = "moveGroupSpec";
    moveGroupSpec.partitionName() = "all objects";
    interface::ConstraintSpecs constraintSpec3;
    constraintSpec3.moveGroupSpec() = moveGroupSpec;
    solver.addConstraint(
        constraintSpec3, std::nullopt, std::nullopt, std::nullopt, -1);
  }
}

} // namespace facebook::rebalancer::binding::tests
