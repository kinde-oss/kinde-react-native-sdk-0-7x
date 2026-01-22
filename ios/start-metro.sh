#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# The repo-root babel.config.js includes @babel/preset-env which transforms
# Metro's prelude to use require() before Metro defines it. We temporarily
# hide it so Metro only uses metro-react-native-babel-preset.
ROOT_BABEL_CONFIG="babel.config.js"
BACKUP_BABEL_CONFIG="babel.config.js.bak-metro"

cleanup() {
  if [ -f "$BACKUP_BABEL_CONFIG" ]; then
    mv "$BACKUP_BABEL_CONFIG" "$ROOT_BABEL_CONFIG"
    echo "Restored $ROOT_BABEL_CONFIG"
  fi
}
trap cleanup EXIT INT TERM

if [ -f "$ROOT_BABEL_CONFIG" ]; then
  mv "$ROOT_BABEL_CONFIG" "$BACKUP_BABEL_CONFIG"
  echo "Temporarily moved $ROOT_BABEL_CONFIG to $BACKUP_BABEL_CONFIG"
fi

# Create a minimal babel config for Metro
cat > "$ROOT_BABEL_CONFIG" << 'EOF'
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
};
EOF

echo "Created minimal babel.config.js for Metro"

# Run Metro
npx react-native start --reset-cache --port 8081
