---
sidebar_position: 1
---

# Local Search With Stages

## Description

The same solver as [local search](local-search.md), with the difference that it works in stages, each one focused on optimizing different intervals of a [goal tuple](../../reference/goal-priorities.md#tuples-strict-priority). Refer to [local search](local-search.md) instead if you are not using goal tuples.

This solver has the same pros and cons as the original local search solver, and it makes use of the same [move types](move-types/move-types.md), except that it allows fine-tuning the solving strategy by splitting the solving into separate stages, each focused on fixing a different goal or set of goals. If properly configured, this separation into stages can make the algorithm converge faster than with unfocused optimization.

## Configuration

A tuple of goals looks like this: `{goal0, goal1, ..., goalN}`.

The original local search algorithm makes no special distinction between a goal tuple and a numeric goal, it simply minimizes one or the other. In the case of a numeric goal, it attempts to find the solution that yields the smallest real number. In the case of tuples, it attempts to find the solution that yields the lexicographically smallest tuple. Some aspects of local search, such as the sorting of source containers, are highly biased towards the first goals in the tuple, prioritizing them throughout the search even when they are already fully optimized, and slightly neglecting the rest. With stages, however, it is possible to separate the search process into separate rounds, each optimizing a different goal in the tuple.

Stages are highly customizable: for example, a single stage can optimize multiple goals at the same time, and different stages may use different move types, different timeouts, etc.

## Example

Say we have defined a problem with 6 goals in a tuple: `{goal0, goal1, ..., goal5}`.

Through intuition and experimentation we've concluded that goals 0, 1 and 2 are closely related and get optimized by similar moves, so it makes sense to optimize them together. We've also concluded that goals 3, 4 and 5 are unrelated to each other and it makes sense to optimize them separately.

The code for this fictitious setup looks as follows:

```cpp
auto solver = ProblemSolverFactory::makeProblemSolver();
// ... set up objects, containers, and dimensions ...

// Build a goal tuple by separating goals with boundaries (see Goal priorities).
BalanceSpec cpuBalance;
cpuBalance.dimension() = "cpu";
solver->addGoal(cpuBalance); // goal 0
solver->addGoalBoundary();

BalanceSpec memoryBalance;
memoryBalance.dimension() = "memory";
solver->addGoal(memoryBalance); // goal 1
solver->addGoalBoundary();

// ... goals 2 through 5 added the same way, each followed by addGoalBoundary() ...

// Builds a stage that optimizes goals [begin, end) using the single move type.
auto makeStage = [](int begin, int end) {
  LocalSearchStageSpec stage;
  stage.begin() = begin;
  stage.end() = end;
  stage.solverSpec()->moveTypeList()->push_back(
      ProblemSolver::makeMoveTypeSpec(SingleMoveTypeSpec()));
  return stage;
};

LocalSearchStageSolverSpec stageSolver;
stageSolver.solveTime() = 300; // overall timeout of 5 minutes
stageSolver.stageSpecs() = {
    makeStage(0, 3), // first stage optimizes goals 0, 1, 2 together
    makeStage(3, 4), // second stage optimizes goal 3
    makeStage(4, 5), // third stage optimizes goal 4
    makeStage(5, 6), // fourth stage optimizes goal 5
};

solver->addSolver(stageSolver);
```

## Parameters

`LocalSearchStageSolverSpec` defines the master settings that affect all stages---most importantly the overall `solveTime` and `stopAfterMoves`---plus the list of `stageSpecs`. These master settings mirror the ones documented for the [local search solver](local-search.md); refer to its documentation for a better understanding.

`stageSpecs` is a list that lets you specify the configuration for each stage. You must define the range of goals within the tuple that the stage should optimize, and a few other parameters. Each stage also embeds its own `solverSpec` (a `LocalSearchSolverSpec`), which is where you select the stage's [move types](move-types/move-types.md) and can override specific master parameters just for that stage (for example, a different timeout or `enableObjectPotentialSorting`).

These are the configuration parameters specific to a stage:

- **`begin`:** the 0-based index of the first goal within the tuple which the stage should optimize.
- **`end`:** the 0-based index of the last goal (not included, so technically the index of the very next goal) within the tuple which the stage should optimize. E.g. if optimizing goals 0, 1 and 2, you should set `begin=0` and `end=3`.
- **`name` (optional):** a name which uniquely identifies the stage. It may be used when referring to the stage in stats reports.
- **`stopAfterMovesTillStage` (optional):** if set, it limits the number of moves that all stages up to and including this one may perform. This can help you better distribute the budget of local search moves among stages. For example, say you define 2 stages and want local search to perform at most 100 moves, but you don't want the first stage to use more than 50 moves. In this case you could set `stopAfterMoves=100` on the master spec, and `stopAfterMovesTillStage=50` on the first stage.
- **`solverSpec`:** a [local search](local-search.md) configuration for this stage. Use it to choose the stage's move types and to override any master parameter (such as `enableObjectPotentialSorting`, which enables an experimental way of [sorting source containers](move-types/move-types.md#common-logic) that ranks them by the potential of the most promising object within them, rather than the overall contribution of the entire container to the objective).
