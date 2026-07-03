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

// Synthetic LP benchmarks for native Gurobi operator paths versus PLF/Big-M
// approximations. Mirrors NativeOperatorLpBenchmark.cpp but targets Gurobi.
// Run locally:
//   buck2 run @mode/opt
//   //algopt/rebalancer/benchmarks/solver_benchmarks:native_operator_gurobi_lp_benchmark

#include "algopt/lp/environment/Environment.h"
#include "algopt/rebalancer/entities/tests/UniverseBuilderTestUtils.h"
#include "algopt/rebalancer/interface/thrift/gen-cpp2/SolverSpecs_types.h"
#include "algopt/rebalancer/solver/expressions/Operators.h"
#include "algopt/rebalancer/solver/expressions/Orchestrator.h"
#include "algopt/rebalancer/solver/solvers/OptimalSolver.h"
#include "algopt/rebalancer/solver/tests/ExprProblemCreation.h"
#include "algopt/rebalancer/solver/utils/Assignment.h"
#include "algopt/rebalancer/solver/utils/Problem.h"

#include <folly/Benchmark.h>
#include <folly/container/irange.h>
#include <folly/init/Init.h>
#include <folly/ScopeGuard.h>

#include <cmath>
#include <cstdio>

namespace algopt = facebook::algopt;

namespace facebook::rebalancer {

namespace {

struct BenchmarkUniverse : public entities::tests::UniverseBuilderTestUtils {
  std::shared_ptr<const entities::Universe> build(
      int nObjects,
      int nContainers) {
    entities::Map<std::string, std::vector<std::string>> init;
    for (const auto i : folly::irange(nContainers)) {
      init[fmt::format("container{}", i)] = {};
    }
    for (const auto i : folly::irange(nObjects)) {
      init["container0"].push_back(fmt::format("object{}", i));
    }
    setInitialAssignment(init);
    return buildUniverse();
  }
};

ExprPtr containerLoad(
    const std::shared_ptr<const entities::Universe>& uni,
    const Assignment& assignment,
    int containerIdx,
    int nObjects) {
  auto load = const_expr(0, uni);
  const auto contId =
      uni->getContainerId(fmt::format("container{}", containerIdx));
  for (const auto i : folly::irange(nObjects)) {
    const auto objId = uni->getObjectId(fmt::format("object{}", i));
    load += variable(objId, contId, uni, assignment);
  }
  return load;
}

interface::OptimalSolverSpec makeSilentGurobiSpec() {
  interface::OptimalSolverSpec spec;
  *spec.suppressLogs() = true;
  *spec.skipInitialAssignmentHint() = true;
  *spec.solverPackage() = interface::OptimalSolverPackage::GUROBI;
  return spec;
}

double buildAndSolveGurobi(Problem& p) {
  OptimalSolver solver(makeSilentGurobiSpec());
  solver.solve(p);
  const auto result = p.lp_store.getLpProblem().getOnlyResult();
  const auto status = *result.status();
  if (status != algopt::lp::thrift::ProblemStatus::OPTIMAL_FOUND &&
      status != algopt::lp::thrift::ProblemStatus::SOLUTION_FOUND) {
    throw std::runtime_error(
        "Solve produced no incumbent; cannot report benchmark objective");
  }
  return static_cast<double>(*result.bestObjective());
}

// ---- Square ----

static constexpr int kN = 100;

double& gGurobiSquareBaseline() {
  static double value = NAN;
  return value;
}
double& gGurobiSquareNative() {
  static double value = NAN;
  return value;
}

BENCHMARK(GurobiSquareLpSolve_baseline) {
  std::unique_ptr<Problem> p_ptr;
  BENCHMARK_SUSPEND {
    algopt::useGurobiNativeQuadratic() = false;
    auto uni = BenchmarkUniverse().build(kN, 2);
    const Assignment assignment(uni->getContainers().getInitialAssignment());
    auto obj = square(containerLoad(uni, assignment, 0, kN), uni);
    p_ptr = packer::tests::createTestProblem(uni, {obj}, const_expr(0, uni));
  }
  gGurobiSquareBaseline() = buildAndSolveGurobi(*p_ptr);
}

BENCHMARK(GurobiSquareLpSolve_native) {
  std::unique_ptr<Problem> p_ptr;
  BENCHMARK_SUSPEND {
    algopt::useGurobiNativeQuadratic() = true;
    auto uni = BenchmarkUniverse().build(kN, 2);
    const Assignment assignment(uni->getContainers().getInitialAssignment());
    auto obj = square(containerLoad(uni, assignment, 0, kN), uni);
    p_ptr = packer::tests::createTestProblem(uni, {obj}, const_expr(0, uni));
  }
  SCOPE_EXIT {
    algopt::useGurobiNativeQuadratic() = false;
  };
  gGurobiSquareNative() = buildAndSolveGurobi(*p_ptr);
}

// ---- Piecewise ----

double& gGurobiPwlBaseline() {
  static double value = NAN;
  return value;
}
double& gGurobiPwlNative() {
  static double value = NAN;
  return value;
}

static std::vector<std::pair<double, double>> makeGurobiPwlPoints() {
  std::vector<std::pair<double, double>> pts;
  pts.reserve(11);
  for (const auto i : folly::irange(11)) {
    const double x = i * (kN / 10.0);
    pts.emplace_back(x, x * x);
  }
  return pts;
}

BENCHMARK(GurobiPiecewiseLpSolve_baseline) {
  std::unique_ptr<Problem> p_ptr;
  BENCHMARK_SUSPEND {
    algopt::useGurobiNativePwl() = false;
    auto uni = BenchmarkUniverse().build(kN, 2);
    const Assignment assignment(uni->getContainers().getInitialAssignment());
    auto obj = piecewise(
        makeGurobiPwlPoints(), containerLoad(uni, assignment, 0, kN), uni);
    p_ptr = packer::tests::createTestProblem(uni, {obj}, const_expr(0, uni));
  }
  gGurobiPwlBaseline() = buildAndSolveGurobi(*p_ptr);
}

BENCHMARK(GurobiPiecewiseLpSolve_native) {
  std::unique_ptr<Problem> p_ptr;
  BENCHMARK_SUSPEND {
    algopt::useGurobiNativePwl() = true;
    auto uni = BenchmarkUniverse().build(kN, 2);
    const Assignment assignment(uni->getContainers().getInitialAssignment());
    auto obj = piecewise(
        makeGurobiPwlPoints(), containerLoad(uni, assignment, 0, kN), uni);
    p_ptr = packer::tests::createTestProblem(uni, {obj}, const_expr(0, uni));
  }
  SCOPE_EXIT {
    algopt::useGurobiNativePwl() = false;
  };
  gGurobiPwlNative() = buildAndSolveGurobi(*p_ptr);
}

// ---- Max ----

double& gGurobiMaxBaseline() {
  static double value = NAN;
  return value;
}
double& gGurobiMaxNative() {
  static double value = NAN;
  return value;
}

BENCHMARK(GurobiMaxLpSolve_baseline) {
  std::unique_ptr<Problem> p_ptr;
  BENCHMARK_SUSPEND {
    algopt::useGurobiNativeMax() = false;
    auto uni = BenchmarkUniverse().build(kN, 2);
    const Assignment assignment(uni->getContainers().getInitialAssignment());
    auto obj =
        max(containerLoad(uni, assignment, 0, kN),
            containerLoad(uni, assignment, 1, kN),
            uni);
    p_ptr = packer::tests::createTestProblem(uni, {obj}, const_expr(0, uni));
  }
  gGurobiMaxBaseline() = buildAndSolveGurobi(*p_ptr);
}

BENCHMARK(GurobiMaxLpSolve_native) {
  std::unique_ptr<Problem> p_ptr;
  BENCHMARK_SUSPEND {
    algopt::useGurobiNativeMax() = true;
    auto uni = BenchmarkUniverse().build(kN, 2);
    const Assignment assignment(uni->getContainers().getInitialAssignment());
    auto obj =
        max(containerLoad(uni, assignment, 0, kN),
            containerLoad(uni, assignment, 1, kN),
            uni);
    p_ptr = packer::tests::createTestProblem(uni, {obj}, const_expr(0, uni));
  }
  SCOPE_EXIT {
    algopt::useGurobiNativeMax() = false;
  };
  gGurobiMaxNative() = buildAndSolveGurobi(*p_ptr);
}

// ---- Step ----
//
// Bin-packing formulation: minimize the number of active containers subject
// to a per-container capacity. MIP optimal: ceil(kStepN / kStepCap) = 17.

static constexpr int kStepN = 200;
static constexpr int kStepK = 20;
static constexpr int kStepCap = 12;

std::unique_ptr<Problem> makeGurobiStepProblem(
    const std::shared_ptr<const entities::Universe>& uni,
    const Assignment& assignment) {
  auto obj = const_expr(0, uni);
  std::vector<ExprPtr> excesses;
  for (const auto k : folly::irange(kStepK)) {
    auto load = containerLoad(uni, assignment, k, kStepN);
    obj = obj + step(load, uni);
    excesses.push_back(load - kStepCap);
  }
  auto constraint = max(excesses, uni);
  return packer::tests::createTestProblem(uni, {obj}, constraint);
}

double& gGurobiStepBaseline() {
  static double value = NAN;
  return value;
}
double& gGurobiStepNative() {
  static double value = NAN;
  return value;
}

BENCHMARK(GurobiStepLpSolve_baseline) {
  std::unique_ptr<Problem> p_ptr;
  BENCHMARK_SUSPEND {
    algopt::useGurobiNativeStep() = false;
    auto uni = BenchmarkUniverse().build(kStepN, kStepK);
    const Assignment assignment(uni->getContainers().getInitialAssignment());
    p_ptr = makeGurobiStepProblem(uni, assignment);
  }
  gGurobiStepBaseline() = buildAndSolveGurobi(*p_ptr);
}

BENCHMARK(GurobiStepLpSolve_native) {
  std::unique_ptr<Problem> p_ptr;
  BENCHMARK_SUSPEND {
    algopt::useGurobiNativeStep() = true;
    auto uni = BenchmarkUniverse().build(kStepN, kStepK);
    const Assignment assignment(uni->getContainers().getInitialAssignment());
    p_ptr = makeGurobiStepProblem(uni, assignment);
  }
  SCOPE_EXIT {
    algopt::useGurobiNativeStep() = false;
  };
  gGurobiStepNative() = buildAndSolveGurobi(*p_ptr);
}

} // namespace

} // namespace facebook::rebalancer

static void
printDevianceGurobi(const char* name, double baseline, double native) {
  if (std::isnan(baseline) || std::isnan(native)) {
    std::printf("[%s] not run (filtered out — no deviance to report)\n", name);
    return;
  }
  const double absDev = std::abs(native - baseline);
  const double relDev =
      std::abs(baseline) > 0.0 ? absDev / std::abs(baseline) : 0.0;
  std::printf(
      "[%s] baseline=%.6f native=%.6f abs_dev=%.8f rel_dev=%.6f%%\n",
      name,
      baseline,
      native,
      absDev,
      relDev * 100.0);
}

int main(int argc, char** argv) {
  const folly::Init init(&argc, &argv);
  folly::runBenchmarks();
  std::puts("\n--- Objective deviance (last iteration of each pair) ---");
  printDevianceGurobi(
      "Square   ",
      facebook::rebalancer::gGurobiSquareBaseline(),
      facebook::rebalancer::gGurobiSquareNative());
  printDevianceGurobi(
      "Piecewise",
      facebook::rebalancer::gGurobiPwlBaseline(),
      facebook::rebalancer::gGurobiPwlNative());
  printDevianceGurobi(
      "Max      ",
      facebook::rebalancer::gGurobiMaxBaseline(),
      facebook::rebalancer::gGurobiMaxNative());
  printDevianceGurobi(
      "Step     ",
      facebook::rebalancer::gGurobiStepBaseline(),
      facebook::rebalancer::gGurobiStepNative());
  return 0;
}
