---
sidebar_position: 17
---

# Group Move With Hint Strategies

Moves a related set of objects together, guided by per-group **hint strategies**. When a
partition has many groups, each with its own constraints, trying every possible
combination is intractable. Instead, this move type lets you hint which strategy to try
for each group, so it only evaluates moves that are known to be feasible for that group.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `primaryPartition` | string | Yes | - | The outer partition |
| `secondaryPartition` | string | Yes | - | The inner partition that splits the primary partition |
| `moveStrategies` | MoveStrategies | Yes | - | The hint strategies to try for each group |
| `unassignedContainer` | string | No | - | If set, an allocated secondary group may be replaced by a different secondary group drawn from this container |
| `secondaryGroupReplacementConfig` | SecondaryGroupReplacementConfig | No | - | Restricts, per secondary group, which other secondary groups may replace it (only used when `unassignedContainer` is set) |

## Behavior

Given a partition whose groups each have unique constraints, the move type applies a
different move strategy per group according to the supplied hints. Each strategy
generates one or more candidate move sets; all generated move sets are compared, and the
best resulting one is applied. By relying on the hints, the move type skips
combinations that are known to be infeasible, drastically shrinking the search space
compared to a brute-force exploration.

## Complexity

Roughly `T * N * S * K` single-move evaluations, where `T` is the number of primary
groups, `N` the average number of objects per (primary, secondary) group, `S` the number
of secondary groups, and `K` the number of move sets generated per group.

## Example

Configure local search to use only the group move with hint strategies move type:

```cpp
GroupMoveWithHintStrategiesMoveTypeSpec groupMove;
groupMove.primaryPartition() = "table";
groupMove.secondaryPartition() = "shard_type";
// moveStrategies supplies the per-group hint strategies to try.

LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec(groupMove));

solver.addSolver(localSearch);
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/solver/moves/tests/GroupMoveWithHintStrategiesTest.cpp#L488-L546))
