#!/usr/bin/env python3
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


# pyre-strict

from algopt.rebalancer.common import utils
from algopt.rebalancer.common.scope import SerfScope
from algopt.rebalancer.common.state_holder import StateHolder
from libfb.py import testutil


class TestStateHolder(testutil.BaseFacebookTestCase):
    def test_all_scopes(self) -> None:
        serf_scope = SerfScope(container_to_scope={"a": "b"})
        serf_scopes = {"serf_scopes": serf_scope}

        sub_region_fd_scope = utils.Holder(container_to_scope={"a3": "b3"})
        sub_region_fd = {"sub_region_fd": sub_region_fd_scope}
        state = StateHolder(
            serf_scopes=serf_scopes,
            sub_region_fd=sub_region_fd,
        )
        self.assertEqual(state.get_scope_by_name("serf_scopes"), serf_scope)
        self.assertEqual(
            # pyre-fixme[16]: Optional type has no attribute `container_to_scope`.
            state.get_scope_by_name("sub_region_fd").container_to_scope,
            # pyre-fixme[16]: `Holder` has no attribute `container_to_scope`.
            sub_region_fd_scope.container_to_scope,
        )
        self.assertNone(state.get_scope_by_name("other_scope"))
        self.assertEqual(
            state.scopes(),
            {
                "serf_scopes": serf_scope,
                "sub_region_fd": sub_region_fd_scope,
            },
        )

    def test_no_scopes(self) -> None:
        state = StateHolder()
        self.assertNone(state.get_scope_by_name("any_scope"))
        self.assertEqual(state.scopes(), {})

    def test_one_scope(self) -> None:
        serf_scope = SerfScope(container_to_scope={"a": "b"})
        serf_scopes = {"serf_scopes": serf_scope}

        state = StateHolder(serf_scopes=serf_scopes)
        self.assertEqual(state.get_scope_by_name("serf_scopes"), serf_scope)
        self.assertNone(state.get_scope_by_name("sub_region_fd"))
        self.assertNone(state.get_scope_by_name("other_scope"))
        self.assertEqual(state.scopes(), {"serf_scopes": serf_scope})

    def test_mapping_interface(self) -> None:
        state = StateHolder()
        state["custom_key"] = "/tmp/rebalancer"
        self.assertIn("custom_key", state)
        self.assertEqual(state["custom_key"], "/tmp/rebalancer")
        self.assertNotIn("missing", state)
        with self.assertRaises(AssertionError):
            state["custom_key"] = "/tmp/other"

    def test_object_and_container_accessors(self) -> None:
        state = StateHolder(
            config_map={"object_name": "task", "container_name": "host"},
            tasks_data={"t1": "task_value"},
            hosts_data={"h1": "host_value"},
            additional_tasks_data={"t2": "extra_task_value"},
        )
        self.assertEqual(state.getObjectName(), "task")
        self.assertEqual(state.getContainerName(), "host")
        self.assertEqual(state.getObjectsData(), {"t1": "task_value"})
        self.assertEqual(state.getContainersData(), {"h1": "host_value"})
        self.assertEqual(state.getAdditionalObjectsData(), {"t2": "extra_task_value"})

    def test_additional_objects_data_missing(self) -> None:
        state = StateHolder(config_map={"object_name": "task"})
        self.assertEqual(state.getAdditionalObjectsData(), {})
