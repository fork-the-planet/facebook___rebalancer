---
sidebar_position: 2
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Single Fast

Like [Single](single.md), but stops early. It explores objects one at a time
(evaluating each object's candidate moves in parallel) and, once it has fully
explored at least `minHotObjects` objects and found a move that improves the
objective, it returns that move---so it may not explore every object in the hot
container.

<img src={useBaseUrl('/img/move-types/single-fast.png')} alt="Single move: an object is moved from the hot container to another container; both the object and the destination are explored" />

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `minHotObjects` | int | No | 1 | Minimum number of objects to fully explore before returning the best improving move found so far |

To bound exploration time per hot container, set `timePerMove` on the
[`LocalSearchSolverSpec`](../local-search.md).

## Behavior

Given the hot container chosen by the [common logic](move-types.md#common-logic), it
fully explores moving one object at a time to every destination. After
`minHotObjects` objects have been explored, it returns the best improving move found;
if none improves the objective yet, it keeps exploring more objects.

## Complexity

At least `minHotObjects * containers` moves are evaluated; in the worst case, all
`objects * containers` are.

## Example

Configure local search to use only the single fast move type:

```cpp
SingleFastMoveTypeSpec singleFast;
singleFast.minHotObjects() = 3;

LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec(singleFast));

solver.addSolver(localSearch);
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/solver/moves/tests/MoveTypeFactoryTest.cpp#L524-L556))
