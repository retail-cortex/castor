---
prompt: "How do I build a Bazel module hermetically using Bzlmod?"
executes: true
expected_skills:
  - bazel
threshold: 0.70
metadata:
  difficulty: "standard"
  category: "build"
---
To build a Bazel module hermetically using Bzlmod:

1. Ensure `MODULE.bazel` is configured with required rulesets and `MODULE.bazel.lock` is committed to guarantee dependency integrity (CWE-829).
2. Execute the build command within Bazel's hermetic sandboxed environment:
   ```bash
   bazel build //...
   ```
3. Run tests hermetically with test output enabled:
   ```bash
   bazel test //... --test_output=errors
   ```
