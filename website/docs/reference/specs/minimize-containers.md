import useBaseUrl from '@docusaurus/useBaseUrl';

# Minimize Containers

**Type**: [Goal](#goal-only)

Pack objects onto as few scope items as possible. Despite the name, the spec
minimizes the number of **scope items** that are in use within a `scope` (which is
the container scope by default, but can be any scope). A scope item counts as in use
when its utilization for `dimension` is greater than zero.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | Yes | - | Descriptive name for logging/debugging |
| `scope` | string | Yes | - | Scope whose in-use scope items are minimized (e.g. `"host"`, `"rack"`) |
| `dimension` | string | Yes | - | Dimension that marks a scope item as in use (commonly the object-count dimension); a scope item is in use when its sum is `> 0` |
| `containerCosts` | map&lt;string, double&gt; | No | 1.0 each | Per-scope-item cost. Emptying a higher-cost scope item is preferred; on a tie in load, the higher-cost scope item is freed first |
| `maxFreeLimit` | i32 | No | all scope items | Stop once this many scope items have been emptied (see [How packing stops](#how-packing-stops)) |
| `filter` | [Filter](../common/filter) | No | all scope items | Which scope items are considered |
| `formula` | MinimizeContainerSpecFormula | No | `NEW` | `NEW` supports `maxFreeLimit`, local search, and containers outside the scope; `LEGACY` is being deprecated |

## Example

An example use: pack tasks onto fewer hosts. Two hosts each hold two tasks; the goal
consolidates them onto a single host (the other ends up empty). Since every task has
the same load, the tasks may end up on either host.

```cpp
solver.setObjectName("task");
solver.setContainerName("host");

solver.setAssignment(std::map<std::string, std::vector<std::string>>{
    {"host0", {"task0", "task1"}},
    {"host1", {"task2", "task3"}},
});

// Pack tasks onto as few hosts as possible.
MinimizeContainersSpec minimizeContainers;
minimizeContainers.scope() = "host";
minimizeContainers.dimension() = "task_count";
solver.addGoal(minimizeContainers);
```

<img src={useBaseUrl('/img/reference/minimize-containers/example-1.png')} alt="Two hosts with two tasks each consolidated onto a single host" />

([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/interface/tests/MinimizeContainersTest.cpp#L273-L300))

## Goal only

MinimizeContainers can only be used as a **goal**; there is no constraint form. Its
cost competes with other goals, so a scope item is emptied only when the packing
gain outweighs any movement or affinity costs.

## How packing stops

Packing continues until either all objects in the scope are in a single scope item,
or the number of emptied scope items reaches `maxFreeLimit` (whichever comes first).
The default `maxFreeLimit` is the total number of scope items, so by default the goal
packs as tightly as possible. `containerCosts` breaks ties: among equally-loaded
scope items, the one with the higher cost is freed first.

:::note Minimizes scope items, not containers
Despite its name, the spec minimizes in-use **scope items** of `scope`. When `scope`
is a higher-level grouping (e.g. `rack`), it frees scope items of that grouping and
may even move objects to containers outside the scope to do so (see
[Example 4](#example-4)).
:::

:::note Limitations
MinimizeContainers does not support dynamic object dimensions or negative dimension
values.
:::

## More Examples {#examples}

### Example 2: with a capacity constraint {#example-2}

Three hosts each hold two tasks, with a [Capacity](capacity) constraint of 3 tasks
per host. Only one host can be emptied (the other two must each hold 3 tasks to stay
within capacity), so two hosts remain in use.
([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/interface/tests/MinimizeContainersTest.cpp#L302-L337))

<img src={useBaseUrl('/img/reference/minimize-containers/example-2.png')} alt="Three hosts; with a capacity of 3 per host, one host is emptied and two hold three tasks each" />

### Example 3: with `maxFreeLimit` and costs {#example-3}

Ten hosts: `host0`-`host7` hold increasing numbers of tasks while `host8` and
`host9` start empty, with ascending per-host costs (and the two empty hosts cheap).
With `maxFreeLimit` of 5, Rebalancer frees five scope items in total---the two
already-empty hosts plus three more---preferring to empty the highest-cost occupied
hosts and consolidating their tasks onto cheaper ones.
([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/interface/tests/MinimizeContainersTest.cpp#L546-L584))

<img src={useBaseUrl('/img/reference/minimize-containers/example-3.png')} alt="Ten hosts; with maxFreeLimit 5, five hosts are freed, preferring the highest-cost ones" />

### Example 4: scope items above the container level {#example-4}

Here the `scope` is `rack` rather than `host`. With `maxFreeLimit` of 2, the goal
frees two racks. Because it minimizes scope items (racks), it may move objects onto
hosts that are not in any rack to empty a rack.
([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/interface/tests/MinimizeContainersTest.cpp#L712-L748))

<img src={useBaseUrl('/img/reference/minimize-containers/example-4.png')} alt="Racks scope; two racks are freed, with objects moved out of scope as needed" />

## Source

- Thrift definition: [`interface/thrift/ProblemSpecs.thrift`](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/interface/thrift/ProblemSpecs.thrift) (`MinimizeContainersSpec`)
- SpecBuilder: [`materializer/spec_builder/MinimizeContainersSpecBuilder.cpp`](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/materializer/spec_builder/MinimizeContainersSpecBuilder.cpp)---the code that defines this spec's behavior
- Tests and runnable examples: [`interface/tests/MinimizeContainersTest.cpp`](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/interface/tests/MinimizeContainersTest.cpp)---the unit tests the snippets on this page are drawn from
