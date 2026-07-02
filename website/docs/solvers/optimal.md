---
sidebar_position: 3
---

# Optimal Solver

## Description

The optimal solver translates the Rebalancer problem into a [linear programming](https://en.wikipedia.org/wiki/Linear_programming) model and then leverages a third-party solver to produce either an optimal solution or a reasonably good one in most cases. Rebalancer currently supports three solvers: [FICO Xpress](https://www.fico.com/en/products/fico-xpress-optimization), [Gurobi](https://www.gurobi.com/), and [HiGHS](https://highs.dev/) (open source). The choice of solver can be configured using the `solverPackage` field in [`OptimalSolverSpec`](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/interface/thrift/SolverSpecs.thrift).

:::note Why "Optimal"?
Given enough time, the solver is guaranteed to produce an optimal solution---hence the name. In real life, however, our applications set a time limit, and the solver will return the best solution found so far when the optimal can't be found in that amount of time.
:::

## Pros

- It can find optimal solutions, unlike [local search](local-search/local-search.md), which may end up at a local optimum.
- It works well with complex constraints and objectives, unlike local search, which is unable to overcome situations where multiple objects have to move concurrently in a specific way for it to not break a constraint.

## Cons

- It doesn't scale as well as other solvers. It may run out of resources when the problem is too large.
- It's a black box. It's often hard to explain the reason behind specific moves.

## Parameters

The optimal solver can be configured by setting appropriate parameters in [`OptimalSolverSpec`](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/interface/thrift/SolverSpecs.thrift).

- **`solverPackage` (default: `XPRESS`):** which solver to use---`XPRESS`, `GUROBI`, or `HIGHS`.
- **`solveTime` (optional):** amount of time the solver may spend finding a solution. If the solver finds the optimal solution and is able to prove its optimality before `solveTime` is reached, then it will stop early and return the optimal solution. If `solveTime` is reached before that happens, then the solver will return the best solution found so far, which may or may not be optimal.
- **`skipInitialAssignmentHint` (default: false):** whether to disable warm start. By default, Rebalancer uses the initial assignment as a hint to prime the solver so it can find feasible solutions faster, commonly known as warm start.
- **`printFullLp` (default: false):** if enabled, Rebalancer will create a file named `problem.mps` in the working directory containing the full linear programming model in [MPS format](https://en.wikipedia.org/wiki/MPS_(format)).
- **`xpressTolerance` (default: 1e-8):** shortcut for setting Xpress control parameters `XPRS_MIPTOL = xpressTolerance` and `XPRS_FEASTOL = xpressTolerance / 5`. The constant 5 is the ratio between the default values of these two parameters.
- **`xpressArgs`:** a dictionary of [Xpress control parameters](https://www.fico.com/fico-xpress-optimization/docs/latest/solver/optimizer/HTML/chapter7.html) to override.
- **`suppressLogs` (default: false):** whether to disable the third-party library's logs. Xpress writes logs to stdout, which is problematic in certain situations. This flag lets you disable them.
- **`skipMipSolveForTesting` (default: false):** internal flag used in benchmarks to measure the LP model build time without solving the problem.
