---
sidebar_position: 1
---

# Solver Overview

Rebalancer provides multiple solver algorithms, each with different trade-offs between solution quality, speed, and scalability. This guide describes the available solvers and helps you choose the right one for your problem.

## Solver types

### Local search

It's a greedy solver which optimizes the problem by making incremental local improvements to the initial solution. An incremental change is typically moving an object to a different container, but this behavior is configurable via [move types](local-search/move-types/move-types.md).

This is the most scalable solver available, and it's highly customizable, but it doesn't guarantee optimal solutions. In cases where the objective or constraint function is not smooth (e.g. specifying binary conditions such as "container X must contain exactly 0 or 5 objects"), it may easily get stuck at a local optimum.

A variant of this solver, [local search with stages](local-search/local-search-with-stages.md), splits the search into multiple stages, each of them focused on optimizing a different goal, which can increase the performance of the solver. It only makes sense to use that variant with [goal tuples](../reference/goal-priorities.md#tuples-strict-priority). See the [local search guide](local-search/local-search.md) for full details on both.

### Optimal

This solver typically produces optimal solutions when the problem is tractable, but it may run out of resources or take a very long time to finish on very large or complex problems. Internally, it translates the Rebalancer problem into a [linear programming](https://en.wikipedia.org/wiki/Linear_programming) model and then leverages a third-party solver to produce an optimal solution in most cases. Rebalancer currently supports three solvers: [FICO Xpress](https://www.fico.com/en/products/fico-xpress-optimization), [Gurobi](https://www.gurobi.com/), and [HiGHS](https://highs.dev/) (open source).

Given enough time, theoretically it will always find an optimal solution. In real life, however, our applications set a time limit, and the solver will return the best solution found when the optimum hasn't been found in that amount of time.

See the [optimal solver guide](optimal) for full details.

## Related documentation

- [Getting Started: Build Your First Model](../getting-started/first-model) - Basic solver usage
