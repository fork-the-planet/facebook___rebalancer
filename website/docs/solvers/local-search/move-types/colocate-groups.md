---
sidebar_position: 20
---

import useBaseUrl from '@docusaurus/useBaseUrl';

# Colocate Groups

Tries moving a related set of objects that share a scope item to every possible
combination of containers in each of the other scope items, so that related groups
end up colocated within the same scope. Useful when several groups (e.g. the shards
of a replica set) must live together in the same region or fault domain.

<img src={useBaseUrl('/img/move-types/colocate-groups.png')} alt="A related set of objects in one scope item is moved together into containers of another scope item so the groups become colocated" />

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `partitionName` | string | Yes | - | The partition whose groups are colocated |
| `relatedGroupsList` | list&lt;ColocateGroupsMoveTypeRelatedGroupsInfo&gt; | Yes | - | Sets of related groups; each set is colocated together, and the sets must be disjoint |
| `colocationScopeName` | string | Yes | - | The scope within which each set of related groups must be colocated (e.g. region) |
| `colocationScopeItemToGroupToContainers` | map | No | all containers | Per scope item and group, restricts the candidate containers considered |
| `defaultSampleSize` | int | No | all destinations | Samples the candidate containers for each (group, scope item) |

## Behavior

For each set of related groups, the move type evaluates relocating the group's objects
from their current scope item into the containers of every other scope item, trying the
possible container combinations (optionally sampled). The best combination that improves
the objective---bringing the related groups into the same scope---is applied.

## Complexity

Roughly `n * |S| * |G|^k`, where `n` is the number of objects moved, `|S|` the number
of scope items, `|G|` the candidate containers per group, and `k` the number of groups
colocated together.

## Example

Configure local search to use only the colocate groups move type:

```cpp
ColocateGroupsMoveTypeSpec colocateGroups;
colocateGroups.partitionName() = "replica_set";
colocateGroups.colocationScopeName() = "region";
// relatedGroupsList describes which groups must be colocated together.

LocalSearchSolverSpec localSearch;
localSearch.moveTypeList()->push_back(
    ProblemSolver::makeMoveTypeSpec(colocateGroups));

solver.addSolver(localSearch);
```

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/solver/moves/tests/ColocateGroupsMoveTypeTest.cpp#L131-L179))
