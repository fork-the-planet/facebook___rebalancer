---
sidebar_position: 24
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Fixed Dest Multi Move

Like [Fixed Dest](fixed-dest.md), but moves **sets of related objects** together rather
than one object at a time. For each equivalent set of objects in the hot container, it
evaluates moving the whole set into a single, fixed destination container.

<img src={useBaseUrl('/img/move-types/fixed-dest-multi-move.png')} alt="Each set of related objects in the source container is evaluated for moving together into one fixed destination container" />

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `maxSamplesPerEquivSet` | int | No | 5 | Number of object samples selected for each equivalent set (higher gives better quality for on-demand equivalent sets) |
| `specialContainer` | string | No | - | The fixed destination container the object sets are moved into |
| `rasLocalSearchMetadata` | RasLocalSearchMetadata | No | - | Optional metadata used by RAS local search |

## Behavior

Given the hot container and a fixed destination, the move type groups the source objects
into equivalent sets, samples up to `maxSamplesPerEquivSet` objects from each set, and
evaluates moving each set together into the destination, applying the best improving
move.

## Complexity

Proportional to the number of equivalent sets times `maxSamplesPerEquivSet`, since the
destination is fixed.

## Example

Configure local search to use only the fixed dest multi move type:

```cpp
FixedDestMultiMoveTypeSpec fixedDestMulti;
fixedDestMulti.specialContainer() = "container1";

LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec(fixedDestMulti));

solver.addSolver(localSearch);
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/solver/moves/tests/MoveTypeFactoryTest.cpp#L635-L678))
