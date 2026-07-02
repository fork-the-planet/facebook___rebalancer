---
sidebar_position: 3
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Single Greedy

Tries moving objects to destination containers, prioritizing destinations by how hot
(most broken) they are, and returns as soon as it finds a move that improves the
objective. It is therefore not guaranteed to explore every object in the hot
container, nor to fully explore the object it moves. Single threaded.

<img src={useBaseUrl('/img/move-types/single-greedy.png')} alt="Single move: an object is moved from the hot container to another container; both the object and the destination are explored" />

## Parameters

`SingleGreedyMoveTypeSpec` takes no parameters. To bound exploration time per hot
container, set `timePerMove` on the [`LocalSearchSolverSpec`](../local-search.md).

## Behavior

Given the hot container chosen by the [common logic](move-types.md#common-logic), it
evaluates moving each object to each other container and returns the **first** move
that improves the objective.

## Complexity

May return after evaluating a single move if it improves the objective; in the worst
case, all `objects * containers` moves are evaluated.

## Example

Configure local search to use only the single greedy move type:

```cpp
LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec(SingleGreedyMoveTypeSpec()));

solver.addSolver(localSearch);
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/solver/moves/tests/MoveTypeFactoryTest.cpp#L557-L590))
