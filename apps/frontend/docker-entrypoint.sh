#!/bin/sh
set -eu

# If any runtime env vars are provided, overwrite the runtime-config.js that will be
# served by nginx. This allows re-pointing the SPA or configuring Cognito at runtime
# without rebuilding the image.
RUNTIME_FILE="/usr/share/nginx/html/runtime-config.js"

# Check for any of the supported runtime overrides
if [ -n "${GRAPHQL_URI-}" ] || [ -n "${COGNITO_USER_POOL_ID-}" ] || [ -n "${COGNITO_USER_POOL_CLIENT_ID-}" ] || [ -n "${COGNITO_REGION-}" ]; then
  echo "Writing runtime config to $RUNTIME_FILE"
  # Use provided values when present, otherwise fall back to safe defaults matching
  # the defaults in source-controlled `public/runtime-config.js`
  cat > "$RUNTIME_FILE" <<EOF
// This file is generated at container start
window.__RUNTIME_CONFIG__ = {
  GRAPHQL_URI: '${GRAPHQL_URI:-http://localhost:3020/graphql}',
  COGNITO_USER_POOL_ID: '${COGNITO_USER_POOL_ID:-us-east-2_CV9d0tKnO}',
  COGNITO_USER_POOL_CLIENT_ID: '${COGNITO_USER_POOL_CLIENT_ID:-4lk87f6cg3o2dr9sbsldkv8ntq}',
  COGNITO_REGION: '${COGNITO_REGION:-us-east-2}',
};
EOF
else
  echo "No runtime overrides provided; leaving existing $RUNTIME_FILE (if present)"
fi

# Execute the given command (nginx) as PID 1
exec "$@"
