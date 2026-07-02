---
sidebar_position: 13
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Single Chain Fast

Like [Single Chain](single-chain.md), but evaluates the chains in parallel and
returns as soon as one improves the objective. It therefore may not visit every
object in the hot container, nor consider every replacement object.

<img src={useBaseUrl('/img/move-types/single-chain-fast.png')} alt="Single chain move: the hot object moves to another container while an object from a third container moves into the hot container" />

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `partitionNameToExploreFastChainsWithinObjectGroup` | string | No | - | If set, only objects in this partition are considered as the object that takes the hot object's place |
| `specialFastColdContainer` | string | No | - | If set, a fixed destination container for the hot object; otherwise all containers are explored |

## Behavior

Same chain construction as [Single Chain](single-chain.md), but the candidate chains
are evaluated in parallel and the first one that improves the objective is returned.

## Complexity

In the worst case, roughly `(objects ^ 2) * containers` neighbors are evaluated.

## Example

Configure local search to use only the single chain fast move type:

```cpp
LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec(SingleChainFastMoveTypeSpec()));

solver.addSolver(localSearch);
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/solver/moves/tests/MoveTypeFactoryTest.cpp#L424-L480))
