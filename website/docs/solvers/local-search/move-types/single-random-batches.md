---
sidebar_position: 4
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Single Random Batches

Like [Single](single.md), but processes destination containers in random batches so
each batch can be evaluated in parallel, returning as soon as a batch contains a move
that improves the objective. It may therefore not explore every object or every
destination.

<img src={useBaseUrl('/img/move-types/single-random-batches.png')} alt="Single move: an object is moved from the hot container to another container; both the object and the destination are explored" />

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `randomContainerBatchSize` | int | No | 10 | Number of destination containers evaluated at a time |

To bound exploration time per hot container, set `timePerMove` on the
[`LocalSearchSolverSpec`](../local-search.md).

## Behavior

Given the hot container chosen by the [common logic](move-types.md#common-logic):

1. Pick one object from the hot container.
2. Shuffle the other containers and take `randomContainerBatchSize` of them at a time.
3. Evaluate moving the object to each container in the batch, in parallel.

Once a batch yields a move that improves the objective, the best move from that batch
is returned.

## Complexity

May return after evaluating `randomContainerBatchSize` moves; in the worst case, all
`objects * containers` moves are evaluated.

## Example

Configure local search to use only the single random batches move type:

```cpp
SingleRandomBatchesMoveTypeSpec singleRandomBatches;
singleRandomBatches.randomContainerBatchSize() = 20;

LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec(singleRandomBatches));

solver.addSolver(localSearch);
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/solver/moves/tests/MoveTypeFactoryTest.cpp#L782-L815))
