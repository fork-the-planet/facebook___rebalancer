---
sidebar_position: 9
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Triple Loop

Evaluates rotating a triplet of objects in a cycle across three containers, and keeps
the best such rotation. This can escape local minima that pairwise [Swap](swap.md)
cannot.

<img src={useBaseUrl('/img/move-types/triple-loop.png')} alt="Triple loop move: three objects rotate in a cycle across the hot container and two other containers" />

## Parameters

`TripleLoopMoveTypeSpec` takes no parameters. To bound exploration time per hot
container, set `timePerMove` on the [`LocalSearchSolverSpec`](../local-search.md).

## Behavior

Given the hot container chosen by the [common logic](move-types.md#common-logic):

1. Pick one object from the hot container (the "hot object").
2. Pick an object in another container (the "other object 1").
3. Pick an object in a third container (the "other object 2").
4. Evaluate, all at once, rotating them: the hot object to other object 1's
   container, other object 1 to other object 2's container, and other object 2 to the
   hot container.

Every such triplet is evaluated and the best rotation is selected.

## Complexity

Roughly `objects ^ 3` neighbors are evaluated.

## Example

Configure local search to use only the triple loop move type:

```cpp
LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec(TripleLoopMoveTypeSpec()));

solver.addSolver(localSearch);
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/solver/moves/tests/MoveTypeFactoryTest.cpp#L236-L279))
