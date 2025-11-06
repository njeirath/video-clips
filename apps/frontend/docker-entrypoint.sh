#!/bin/sh
set -eu

# If GRAPHQL_URI env var is provided, overwrite the runtime-config.js that will be
# served by nginx. This allows re-pointing the SPA at runtime without rebuilding.
RUNTIME_FILE="/usr/share/nginx/html/runtime-config.js"

if [ -n "${GRAPHQL_URI-}" ]; then
  echo "Writing runtime config to $RUNTIME_FILE"
  cat > "$RUNTIME_FILE" <<EOF
// This file is generated at container start
window.__RUNTIME_CONFIG__ = { GRAPHQL_URI: '${GRAPHQL_URI}' };
EOF
else
  echo "GRAPHQL_URI not set; leaving existing $RUNTIME_FILE (if present)"
fi

# Execute the given command (nginx) as PID 1
exec "$@"
