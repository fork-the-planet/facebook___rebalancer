---
sidebar_position: 1
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Single

Evaluates moving a single object to every possible destination container and keeps
the best move. All candidate moves are evaluated in parallel.

<img src={useBaseUrl('/img/move-types/single.png')} alt="Single move: an object is moved from the hot container to another container; both the object and the destination are explored" />

## Parameters

`SingleMoveTypeSpec` takes no parameters. To bound how long the solver spends
exploring moves out of one hot container, set `timePerMove` on the
[`LocalSearchSolverSpec`](../local-search.md).

## Behavior

Given the hot container chosen by the [common logic](move-types.md#common-logic):

1. Pick one object from the hot container (the "hot object").
2. Pick a different container (the "other container").
3. Evaluate moving the hot object to the other container.

Every (object, destination) combination is evaluated, and the best move overall is
selected.

## Complexity

Roughly `objects * containers` neighbors are evaluated.

## Example

Configure local search to use only the single move type:

```cpp
LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec(SingleMoveTypeSpec()));

solver.addSolver(localSearch);
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/solver/moves/tests/MoveTypeFactoryTest.cpp#L131-L185))
