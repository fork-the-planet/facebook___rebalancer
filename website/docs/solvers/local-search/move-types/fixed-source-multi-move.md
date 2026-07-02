---
sidebar_position: 25
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Fixed Source Multi Move

Like [Fixed Source](fixed-source.md), but moves **sets of related objects** together
rather than one object at a time. For each equivalent set of objects in a specified
source container, it evaluates moving the whole set into the hot container.

<img src={useBaseUrl('/img/move-types/fixed-source-multi-move.png')} alt="Each set of related objects in the specified source container is evaluated for moving together into the hot container" />

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `maxSamplesPerEquivSet` | int | No | 5 | Number of object samples selected for each equivalent set (higher gives better quality for on-demand equivalent sets) |
| `specialContainer` | string | No | - | The fixed source container the object sets are moved out of |
| `rasLocalSearchMetadata` | RasLocalSearchMetadata | No | - | Optional metadata used by RAS local search |

## Behavior

Given a fixed source container and the hot container chosen by the
[common logic](move-types.md#common-logic), the move type groups the source objects into
equivalent sets, samples up to `maxSamplesPerEquivSet` objects from each set, and
evaluates moving each set together into the hot container, applying the best improving
move.

## Complexity

Proportional to the number of equivalent sets times `maxSamplesPerEquivSet`, since the
source is fixed.

## Example

Configure local search to use only the fixed source multi move type:

```cpp
FixedSrcMultiMoveTypeSpec fixedSourceMulti;
fixedSourceMulti.specialContainer() = "container1";

LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec(fixedSourceMulti));

solver.addSolver(localSearch);
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/solver/moves/tests/MoveTypeFactoryTest.cpp#L591-L634))
