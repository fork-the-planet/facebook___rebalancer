import useBaseUrl from '@docusaurus/useBaseUrl';

# Maximize Allocation

**Type**: [Goal](#goal-only)

Maximize the utilization of a set of scope items. The goal rewards filling scope
items as much as possible for a given `dimension`, which is useful when objects
contribute more on some scope items than others and you want to place them where
they pack best.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | Yes | - | Descriptive name for logging/debugging |
| `scope` | string | Yes | - | Scope whose scope items' utilization is maximized (e.g. `"host"`) |
| `dimension` | string | Yes | - | Dimension whose relative utilization is maximized |
| `filter` | [Filter](../common/filter) | No | all scope items | Which scope items count toward the goal (set `itemsWhitelist` or `itemsBlacklist`) |

The goal value is proportional to the negated sum of each scope item's relative utilization for
`dimension`, so minimizing it maximizes the total fill across the selected scope
items.

## Example

This example uses a **dynamic** dimension: each task contributes `1` by default, but
`5` on its preferred host. There are 3 hosts (capacity 10 each) and 6 tasks.
Initially every task sits on a host where it contributes only `1`, so each host is
at `2/10` = 20% utilization.

**Initial assignment:**

<img src={useBaseUrl('/img/reference/maximize-allocation/example-initial-setup.png')} alt="Initial assignment: each host holds two tasks contributing 1 each, so 20% utilized; a table lists each task's preferred host where it contributes 5" />

```cpp
solver.setObjectName("task");
solver.setContainerName("host");

solver.setAssignment(std::map<std::string, std::vector<std::string>>{
    {"host0", {"task0", "task1"}},
    {"host1", {"task2", "task3"}},
    {"host2", {"task4", "task5"}},
});

// "load" is a dynamic dimension: each task contributes 1 by default, but 5 on its
// preferred host. Each host has a capacity of 10 for the same dimension.
solver.addDynamicObjectDimension(
    "load", "host",
    std::map<std::string, std::map<std::string, double>>{
        {"host1", {{"task0", 5}, {"task1", 5}}},
        {"host2", {{"task2", 5}, {"task3", 5}}},
        {"host0", {{"task4", 5}, {"task5", 5}}},
    },
    /*defaultValue=*/1);
solver.addScopeDimension(
    "load", "host",
    std::map<std::string, double>{{"host0", 10}, {"host1", 10}, {"host2", 10}});

// Maximize the hosts' utilization of "load".
MaximizeAllocationSpec maximizeAllocation;
maximizeAllocation.scope() = "host";
maximizeAllocation.dimension() = "load";
solver.addGoal(maximizeAllocation);
```

Rebalancer moves each task to its preferred host, where it contributes `5`. Each
host then holds two such tasks for `10/10` = 100% utilization.

**Final assignment:**

<img src={useBaseUrl('/img/reference/maximize-allocation/example-solution.png')} alt="Final assignment: each task moved to its preferred host, so every host is 100% utilized" />

## Goal only

MaximizeAllocation can only be used as a **goal**; there is no constraint form. Its
value competes with other goals, so utilization is increased only when the gain
outweighs other costs. Use `filter` to maximize utilization on a subset of scope
items---for example, draining everything else onto a chosen set.

## Source

- Thrift definition: [`interface/thrift/ProblemSpecs.thrift`](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/interface/thrift/ProblemSpecs.thrift) (`MaximizeAllocationSpec`)
- SpecBuilder: [`materializer/spec_builder/MaximizeAllocationSpecBuilder.cpp`](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/materializer/spec_builder/MaximizeAllocationSpecBuilder.cpp)---the code that defines this spec's behavior
- Tests and runnable examples: [`interface/tests/MaximizeAllocationTest.cpp`](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/interface/tests/MaximizeAllocationTest.cpp)---the unit test for this spec
