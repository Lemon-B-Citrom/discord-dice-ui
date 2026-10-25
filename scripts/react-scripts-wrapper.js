//
// Acts as a platform-agnostic wrapper for the `react-scripts` package commands
// dev --> start
// build --> build
//
'use strict';

const { spawnSync } = require('child_process');

const action = process.argv[2];
const reactScriptsEntrypoints = {
  start: 'react-scripts/scripts/start',
  build: 'react-scripts/scripts/build',
};

const entrypoint = reactScriptsEntrypoints[action];

if (!entrypoint) {
  console.error(`Unsupported react-scripts action: ${action || '(missing)'}`);
  process.exit(1);
}

const env = {
  ...process.env,
  GENERATE_SOURCEMAP: 'false',
};

// react-scripts 3 uses webpack 4, which needs the legacy provider on Node 17+.
// Node 14 (the version declared by this project) does not recognize that flag.
if (Number(process.versions.node.split('.')[0]) >= 17) {
  const nodeOptions = env.NODE_OPTIONS || '';
  if (!nodeOptions.includes('--openssl-legacy-provider')) {
    env.NODE_OPTIONS = `${nodeOptions} --openssl-legacy-provider`.trim();
  }
}

const result = spawnSync(
  process.execPath,
  [require.resolve(entrypoint)],
  { env, stdio: 'inherit' },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status === null ? 1 : result.status);
