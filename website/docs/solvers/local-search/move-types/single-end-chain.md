---
sidebar_position: 12
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Single End Chain

Evaluates two-object chains where the hot container is at the **end** of the chain:
the hot object moves to another container, and an object already in that container
moves on to a third container. The hot container gives out an object without
receiving one back. This is usually the better default among the chain move types.

<img src={useBaseUrl('/img/move-types/single-end-chain.png')} alt="Single end chain move: the hot object moves into another container while an object from that container moves on to a third container" />

## Parameters

`SingleEndChainMoveTypeSpec` takes no parameters. To bound exploration time per hot
container, set `timePerMove` on the [`LocalSearchSolverSpec`](../local-search.md).

## Behavior

Given the hot container chosen by the [common logic](move-types.md#common-logic):

1. Pick one object from the hot container (the "hot object").
2. Pick two other containers, "other container 1" and "other container 2".
3. Pick one object from "other container 1" (the "other object").
4. Evaluate, at once, moving the hot object to "other container 1" and the other
   object to "other container 2".

Every such combination is evaluated and the best chain is selected.

## Complexity

Roughly `(objects ^ 2) * containers` neighbors are evaluated.

## Example

Configure local search to use only the single end chain move type:

```cpp
LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec(SingleEndChainMoveTypeSpec()));

solver.addSolver(localSearch);
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/solver/moves/tests/MoveTypeFactoryTest.cpp#L887-L919))
