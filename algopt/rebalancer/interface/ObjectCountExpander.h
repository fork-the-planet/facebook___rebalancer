// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#pragma once

#include "algopt/rebalancer/algopt_common/Concepts.h"
#include "algopt/rebalancer/interface/thrift/gen-cpp2/ProblemSpecs_types.h"
#include "algopt/rebalancer/interface/thrift/gen-cpp2/Types_types.h"

#include <fmt/core.h>
#include <folly/container/F14Map.h>

#include <cstdint>
#include <stdexcept>
#include <string>
#include <vector>

namespace facebook::rebalancer::interface {

// Bridges between compact assignment (container -> object -> count) and the
// existing per-object assignment API (container -> vector<string>) by
// generating synthetic object names ({name}__0, {name}__1, ...).
//
// Constructed with a ContainerAssignment in compact counted form; expansion
// happens at construction time. All subsequent expand/compress methods use the
// mapping built in the constructor.
class ObjectCountExpander {
 public:
  static constexpr std::string_view kSyntheticDelimiter = "__";

  // Expands compact assignment into per-object assignment at construction.
  // Throws std::invalid_argument if any count <= 0.
  explicit ObjectCountExpander(const ContainerAssignment& compactAssignment);

  // Replace original object names with synthetic names in specs.
  // Expands to ALL synthetic instances of the object. Per-instance pinning
  // (e.g., pin 2 of 4) requires native count support (Phase 4+).
  AvoidMovingSpec expandAvoidMovingSpec(const AvoidMovingSpec& spec) const;
  MovesInProgressSpec expandMovesInProgressSpec(
      const MovesInProgressSpec& spec) const;

  // Generic expansion: accepts any iterable over (objectName, value) pairs
  // and returns an internal map keyed by synthetic object name.
  template <
      typename ObjectToValue,
      typename Value = typename ObjectToValue::value_type::second_type>
  folly::F14FastMap<std::string, Value> expandObjectMap(
      const ObjectToValue& objectToValue) const
    requires IsIterableOverPairs<ObjectToValue, std::string, Value>
  {
    folly::F14FastMap<std::string, Value> expanded;
    for (const auto& [objectName, value] : objectToValue) {
      for (const auto& syntheticName :
           lookupSyntheticsOrThrow(objectName, "expandObjectMap")) {
        expanded[syntheticName] = value;
      }
    }
    return expanded;
  }

  // Compress synthetic names back to compact form on the solution.
  void compressSolution(AssignmentSolution& solution) const;

  const folly::F14FastMap<std::string, std::vector<std::string>>&
  getExpandedAssignment() const;
  const folly::F14FastMap<std::string, std::vector<std::string>>&
  getObjectToSyntheticNames() const;
  const folly::F14FastMap<std::string, std::string>& getSyntheticToObject()
      const;

 private:
  static std::string makeSyntheticName(
      std::string_view objectName,
      int64_t index);

  // Lookup an object's synthetic names, throwing if not found.
  const std::vector<std::string>& lookupSyntheticsOrThrow(
      std::string_view objectName,
      std::string_view context) const;

  // Flatten a list of object names into all their synthetic names.
  std::vector<std::string> expandObjectNames(
      const std::vector<std::string>& objectNames,
      std::string_view context) const;

  // Compress a single object->container map into a compact ContainerAssignment.
  // Throws std::runtime_error if any name is not a known synthetic.
  ContainerAssignment compressAssignment(
      const folly::F14FastMap<std::string, std::string>& assignment) const;

  folly::F14FastMap<std::string, std::vector<std::string>> expandedAssignment_;
  folly::F14FastMap<std::string, std::vector<std::string>>
      objectToSyntheticNames_;
  folly::F14FastMap<std::string, std::string> syntheticToObject_;
};

} // namespace facebook::rebalancer::interface
