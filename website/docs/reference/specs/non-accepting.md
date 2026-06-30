import useBaseUrl from '@docusaurus/useBaseUrl';

# Non Accepting

**Type**: [Constraint](#constraint-only)

Prevent a given set of scope items from receiving any new objects. For example,
stop a host that is being drained from accepting more tasks while a rebalance runs.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | Yes | - | Descriptive name for logging/debugging |
| `scope` | string | Yes | - | Scope the listed scope items belong to (e.g. `"host"`, `"rack"`) |
| `items` | list&lt;string&gt; | Yes | - | The scope items that may not receive any new objects |

A listed scope item may keep the objects already assigned to it, but no object
that is not already there may move in.

## Example

An example use: pin a host so nothing new lands on it. There are 3 hosts and 2
tasks, both initially on `host0`. A NonAccepting constraint marks `host1` as
non-accepting. An AssignmentAffinities goal then expresses that `task0` prefers
`host1` and `task1` prefers `host2`.
([source](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/interface/tests/NonAcceptingTest.cpp#L27-L74))

**Initial assignment:**

<img src={useBaseUrl('/img/reference/non-accepting/example-initial.png')} alt="Initial assignment: task0 and task1 both on host0, host1 and host2 empty" />

```cpp
solver.setObjectName("task");
solver.setContainerName("host");

solver.setAssignment(std::map<std::string, std::vector<std::string>>{
    {"host0", {"task0", "task1"}},
    {"host1", {}},
    {"host2", {}},
});

// host1 may not accept any new objects.
NonAcceptingSpec nonAccepting;
nonAccepting.scope() = "host";
nonAccepting.items() = {"host1"};
solver.addConstraint(nonAccepting);

// task0 prefers host1, task1 prefers host2.
auto pref = [](std::string task, std::string host, double affinity) {
  AssignmentAffinity entry;
  entry.objectName() = std::move(task);
  entry.scopeItemName() = std::move(host);
  entry.affinity() = affinity;
  return entry;
};

AssignmentAffinitiesSpec affinities;
affinities.scope() = "host";
affinities.affinities() = {
    pref("task0", "host1", 1),
    pref("task1", "host2", 1),
};
solver.addGoal(affinities);
```

`task1` moves to `host2`, which it prefers. `task0` would prefer `host1`, but it
cannot move there because that would violate the NonAccepting constraint, so it
stays on `host0`.

**Final assignment:**

<img src={useBaseUrl('/img/reference/non-accepting/example-final.png')} alt="Final assignment: task1 moved to host2, task0 stayed on host0 because host1 is non-accepting" />

## Constraint only

NonAccepting can only be used as a **constraint**; there is no goal form. It only
forbids *new* placements into the listed scope items, so it always holds in the
initial assignment and, under the [default constraint policy](../constraint-policy#policies),
Rebalancer is guaranteed to not move an object into a listed scope item.

## Source

- Thrift definition: [`interface/thrift/ProblemSpecs.thrift`](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/interface/thrift/ProblemSpecs.thrift) (`NonAcceptingSpec`)
- SpecBuilder: [`materializer/spec_builder/NonAcceptingSpecBuilder.cpp`](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/materializer/spec_builder/NonAcceptingSpecBuilder.cpp)---the code that defines this spec's behavior
- Tests and runnable examples: [`interface/tests/NonAcceptingTest.cpp`](https://github.com/facebook/rebalancer/blob/main/algopt/rebalancer/interface/tests/NonAcceptingTest.cpp#L27-L74)---the unit test the snippet on this page is drawn from
