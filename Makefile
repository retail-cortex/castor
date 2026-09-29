# Copyright 2026 Ryan McGuinness
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

.PHONY: all build test test-e2e lint fmt validate server cli docs clean

all: build test

build:
	bazel build //...

test:
	bazel test //...

test-e2e:
	bazel test //:test-e2e

lint:
	bazel run //:go -- vet ./cmd/... ./pkg/... ./internal/... ./clients/go/...

fmt:
	bazel run //:go -- fmt ./cmd/... ./pkg/... ./internal/... ./clients/go/...

validate:
	bazel run //:validate

server:
	bazel run //cmd/castor_server

cli:
	bazel run //cmd/cstr -- $(ARGS)

docs:
	bazel run //docs:serve

clean:
	bazel clean
