---
sidebar_position: 11
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Single Chain

Evaluates two-object chains: one object leaves the hot container for another
container, and a second object takes its place in the hot container. Here the hot
container sits in the **middle** of the chain---it gives out one object and receives
one back.

:::tip
[Single End Chain](single-end-chain.md) is usually the better default. It produces
the same kind of two-object chain, but leaves the hot container at the *end* (it
gives out an object without receiving one back).
:::

<img src={useBaseUrl('/img/move-types/single-chain.png')} alt="Single chain move: the hot object moves to another container while an object from a third container moves into the hot container" />

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `partitionNameToExploreChainsWithinObjectGroup` | string | No | - | If set, only objects in this partition are considered as the object that takes the hot object's place |
| `specialColdContainer` | string | No | - | If set, a fixed destination container for the hot object; otherwise all containers are explored |

## Behavior

Given the hot container chosen by the [common logic](move-types.md#common-logic):

1. Pick one object from the hot container (the "hot object").
2. Pick two other containers, "other container 1" and "other container 2".
3. Pick one object from "other container 1" (the "other object").
4. Evaluate, at once, moving the hot object to "other container 2" and the other
   object into the hot container.

Every such combination is evaluated and the best chain is selected.

## Complexity

Roughly `(objects ^ 2) * containers` neighbors are evaluated.

## Example

Configure local search to use only the single chain move type:

```cpp
LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec(SingleChainMoveTypeSpec()));

solver.addSolver(localSearch);
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/solver/moves/tests/MoveTypeFactoryTest.cpp#L368-L423))
