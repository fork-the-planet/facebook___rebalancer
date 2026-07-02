---
sidebar_position: 5
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Swap

Evaluates exchanging a pair of objects---one from the hot container and one from
another container---and keeps the best such swap.

<img src={useBaseUrl('/img/move-types/swap.png')} alt="Swap move: an object in the hot container and an object in another container exchange places" />

## Parameters

`SwapMoveTypeSpec` needs no parameters for a basic pairwise swap. It also supports
advanced options, such as `sampleSize` to evaluate only a sample of swaps (subsuming
the older "swap sampled" move type) and greedy exploration of the source/destination.
To bound exploration time per hot container, set `timePerMove` on the
[`LocalSearchSolverSpec`](../local-search.md).

## Behavior

Given the hot container chosen by the [common logic](move-types.md#common-logic):

1. Pick one object from the hot container (the "hot object").
2. Pick an object outside the hot container (the "other object").
3. Evaluate exchanging the two objects' containers.

Every (hot object, other object) combination is evaluated, and the best swap is
selected.

## Complexity

Roughly `objects ^ 2` neighbors are evaluated.

## Example

Configure local search to use only the swap move type:

```cpp
LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec(SwapMoveTypeSpec()));

solver.addSolver(localSearch);
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/solver/moves/tests/MoveTypeFactoryTest.cpp#L186-L235))
