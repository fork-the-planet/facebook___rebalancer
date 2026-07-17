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

#include "algopt/rebalancer/interface/tests/utils.h"

#include <gtest/gtest.h>

#include <map>
#include <string>
#include <tuple>

using namespace facebook::rebalancer::interface;

class AssignmentFormatTest
    : public ::testing::TestWithParam<std::tuple<int, bool>> {
 protected:
  static int getThreadCount() {
    return std::get<0>(GetParam());
  }
  static bool getMoveGroups() {
    return std::get<1>(GetParam());
  }
};

INSTANTIATE_TEST_CASE_P(
    NumThreadsAndMoveGroups,
    AssignmentFormatTest,
    ::testing::Combine(testThreadCounts(), ::testing::Values(false, true)));

TEST_P(AssignmentFormatTest, Basic) {
  auto solver =
      initializeTestProblemSolver({.executorThreadCount = getThreadCount()});

  auto moveGroups = getMoveGroups();

  solver->setObjectName("task");
  solver->setContainerName("host");
  solver->setAssignment(
      std::vector<std::pair<std::string, std::vector<std::string>>>{
          {"host0", {"task0", "task1"}},
          {"host1", {"task2", "task3"}},
      });
  solver->addPartition(
      "job",
      std::map<std::string, std::vector<std::string>>{
          {"job0", {"task0", "task1"}},
          {"job1", {"task2", "task3"}},
      });

  if (moveGroups) {
    MoveGroupSpec spec;
    spec.partitionName() = "job";
    solver->addConstraint(spec);
  }

  solver->addSolver(makeDefaultLocalSearchSolver());

  auto solution = solver->solve();

  const std::map<std::string, std::string> initialAssignment = {
      {"task0", "host0"},
      {"task1", "host0"},
      {"task2", "host1"},
      {"task3", "host1"},
  };
  EXPECT_EQ(initialAssignment, toOrderedMap(*solution.initialAssignment()));

  const std::map<std::string, std::vector<std::string>> finalAssignment = {
      {"host0", {"task0", "task1"}},
      {"host1", {"task2", "task3"}},
  };
  EXPECT_EQ(initialAssignment, toOrderedMap(*solution.assignment()));
}
