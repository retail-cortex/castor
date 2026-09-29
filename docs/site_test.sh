#!/usr/bin/env bash
set -euo pipefail

# Verify Hugo site artifact output directory exists and contains index.html
SITE_DIR=$(find . -name "index.html" -path "*/docs/site/*" | head -n 1)

if [ -z "${SITE_DIR}" ]; then
  echo "Error: index.html not found in Hugo site build outputs."
  exit 1
fi

# Verify stylesheet references are populated and do not point to empty "/"
if grep -q 'main.*\.min\.css' "${SITE_DIR}"; then
  echo "Theme stylesheet found."
else
  echo "Error: Main stylesheet missing from ${SITE_DIR}"
  exit 1
fi

if grep -A 2 'rel="stylesheet"' "${SITE_DIR}" | grep -q 'href="/"'; then
  echo "Error: index.html has empty stylesheet references (href=\"/\"). Theme assets missing!"
  exit 1
fi

echo "Hugo site successfully verified at ${SITE_DIR}"
exit 0

