import useBaseUrl from '@docusaurus/useBaseUrl';

# Disaster Recovery Capacity

**Type**: [Goal or Constraint](#goal-vs-constraint)

Reserve enough spare capacity to survive the failure of a **failure domain**. A
*disaster group* is a set of scope items that fail together (e.g. all hosts in a
rack, or a region). When such a group goes down, the load it was carrying fails
over to surviving scope items via **secondary** (replica) objects. This spec sizes
that failover: as a **goal** it minimizes the extra capacity that would be needed,
and as a **constraint** it ensures every scope item can absorb the worst-case
failover while staying within its capacity.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | Yes | - | Descriptive name for logging/debugging |
| `scope` | string | Yes | - | The scope where disasters happen; its scope items are the units that can fail |
| `dimension` | string | Yes | - | The capacity dimension `d`, defined on objects (each object's load) and on scope items (each scope item's capacity) |
| `sharedDisasterGroups` | list&lt;set&lt;string&gt;&gt; | No | each scope item alone | Each set lists scope items that fail together. Any scope item not in some set is treated as its own singleton disaster group |
| `primaryToSetOfSecondaryObjects` | map&lt;string, list&lt;string&gt;&gt; | No | {} | Maps each primary object to its **ordered** list of secondary (failover) objects, highest-priority first |

## How it works

For each scope item, the spec computes a **total required usage** that combines
normal load with the worst-case failover load:

- **Primary usage** --- the sum of `dimension` over the *primary* objects placed on
  the scope item in the final assignment.
- **Disaster usage** --- for each disaster group (one failure scenario), the
  **excess load** the scope item must absorb if that group fails; the spec takes
  the **maximum** across all scenarios. When a group fails, a primary `P` whose
  scope item is in the failing group sheds its load onto the highest-priority
  secondary of `P` that did *not* also fail: a secondary `R` on scope item `S`
  contributes its load to `S` only when `P` is in the failing group **and** every
  higher-priority secondary of `P` is in the failing group too. Scope items that
  are themselves in the failing group contribute nothing (they are down).

`total usage(scope item) = primary usage + max-over-scenarios disaster usage`.

- **As a constraint**, each scope item must satisfy `total usage ≤ capacity`, where
  capacity is the scope-item value of `dimension`. So no scope item is overcommitted
  in any single failure scenario.
- **As a goal**, the value is the total amount by which scope items exceed their
  capacity---i.e. the additional capacity that would have to be provisioned.

A consequence: placing a primary and its secondary on scope items that fail
*together* makes the failover free (both die in the same disaster), so the solver
is pushed toward such placements.

## Example

The examples share this setup: 3 hosts and 7 tasks. `host0` holds `task0`-`task2`,
`host1` holds `task3`-`task6`, and `host2` is empty. Each task has a `load`. The
diagram also shows a per-host capacity of 6/8/4---a *separate* dimension that this
goal example does not use. The goal below uses the `load` dimension, whose per-host
capacity is left at 0:

<img src={useBaseUrl('/img/reference/disaster-recovery-capacity/initial-setup.png')} alt="Initial setup: host0 holds task0-2, host1 holds task3-6, host2 empty; per-task loads and host capacities" />

There are three primary objects, each with one secondary (failover) replica:
`task0`→`task3`, `task1`→`task4`, `task2`→`task5`.

<img src={useBaseUrl('/img/reference/disaster-recovery-capacity/disaster-group.png')} alt="Primary-to-secondary mapping: task0/task3, task1/task4, task2/task5" />

Each host is its own disaster group (the default). Used as a goal, the spec value
is the total failover load that must be reserved.
([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/interface/tests/DisasterRecoveryCapacitySpecTest.cpp#L91-L122))

```cpp
solver.setObjectName("task");
solver.setContainerName("host");

solver.setAssignment(std::map<std::string, std::vector<std::string>>{
    {"host0", {"task0", "task1", "task2"}},
    {"host1", {"task3", "task4", "task5", "task6"}},
    {"host2", {}},
});

// Each task's load. The hosts' "load" capacity is left at 0, which puts the spec
// in goal mode where the objective reports the raw reserved load. (For a
// constraint, set these to each host's real capacity instead.)
std::map<std::string, double> load = {
    {"task0", 1}, {"task1", 2}, {"task2", 5},
    {"task3", 1}, {"task4", 2}, {"task5", 5}, {"task6", 5}};
solver.addObjectDimension("load", load);
solver.addScopeDimension(
    "load", "host",
    std::unordered_map<std::string, double>{{"host0", 0}, {"host1", 0}, {"host2", 0}});

// task0, task1, task2 are primaries; each has one secondary failover replica.
DisasterRecoveryCapacitySpec drCapacity;
drCapacity.scope() = "host";
drCapacity.dimension() = "load";
drCapacity.primaryToSetOfSecondaryObjects() = {
    {"task0", {"task3"}},
    {"task1", {"task4"}},
    {"task2", {"task5"}},
};
solver.addGoal(drCapacity);
```

Because nothing forces primaries and secondaries apart, the solver colocates each
primary with its secondary, so when a host fails both copies die together and no
failover capacity is needed elsewhere. Only the primary load remains, giving an
objective of `task0 + task1 + task2 = 1 + 2 + 5 = 8`:

<img src={useBaseUrl('/img/reference/disaster-recovery-capacity/example-1-solution.png')} alt="Example 1 solution: each primary colocated with its secondary, objective 8" />

## Goal vs. constraint

**As a constraint**, set each scope item's value of `dimension` to its real
capacity; the spec then guarantees that, for every single failure scenario, the
surviving scope items can absorb the failover without exceeding capacity. If the
initial assignment already satisfies this, so will the final one; otherwise the
general [constraint policy](../constraint-policy) applies.

**As a goal**, the value is the aggregate capacity shortfall across scope items
(the extra capacity to provision); minimizing it drives load and its failover
replicas into arrangements that need the least disaster reservation.

## More Examples {#examples}

Both examples build on the [setup above](#example).

### Example 2: secondary forced onto a surviving scope item {#example-2}

Same as the [example above](#example), but an `ExclusiveObjects` constraint forbids
`task2` and its secondary `task5` from sharing a host. Now, if the host holding `task2` fails, `task5` (on a
*different*, surviving host) must take over `task2`'s load---so that host has to
reserve an extra 5. The objective becomes primary load `8` plus the failover load
`5`, for a total of `13`.
([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/interface/tests/DisasterRecoveryCapacitySpecTest.cpp#L124-L171))

<img src={useBaseUrl('/img/reference/disaster-recovery-capacity/example-2-solution.png')} alt="Example 2 solution: task2 and task5 on different hosts, objective 13" />

The example above (each primary colocated with its secondary) is the
[`OnlyPrimaryObjectsMatter`](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/interface/tests/DisasterRecoveryCapacitySpecTest.cpp#L91-L122)
test.

## Source

- Thrift definition: [`interface/thrift/ProblemSpecs.thrift`](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/interface/thrift/ProblemSpecs.thrift) (`DisasterRecoveryCapacitySpec`)
- SpecBuilder: [`materializer/spec_builder/DisasterRecoveryCapacitySpecBuilder.cpp`](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/materializer/spec_builder/DisasterRecoveryCapacitySpecBuilder.cpp)---the code that defines this spec's behavior
- Tests and runnable examples: [`interface/tests/DisasterRecoveryCapacitySpecTest.cpp`](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/interface/tests/DisasterRecoveryCapacitySpecTest.cpp)---the unit tests the snippets on this page are drawn from
