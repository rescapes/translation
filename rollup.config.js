import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import pkg from './package.json';
import R from 'ramda';

const config = {
  input: [
    './src/index.mjs',
    './src/i18n.spec.js'
  ],
  plugins: []
};
// I have no idea why all these child dependencies must be marked external.
// I don't have to do this in any other project. I hate Babel
const externals = [
  'symbol-observable',
  'folktale/concurrency/task',
  'folktale/result',
  'folktale/maybe',
  '@turf/bbox',
  '@turf/bbox-polygon',
  '@turf/center',
  '@turf/rhumb-distance',
  '@turf/rhumb-bearing',
  'numeral',
  'parse-decimal-number',
  'graphql-geojson',
  'fast-json-stable-stringify',
  'zen-observable',
  'apollo-test-utils',
  'apollo-client-preset',
  'enzyme',
  'enzyme-wait',
  'winston'
];

const configs = R.map(c => {
  return R.merge(config, c);
}, [
  // CommonJS
  {
    output: {
      dir: 'lib',
      format: 'cjs',
      indent: true,
      source: true
    },
    external: [
      ...externals,
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: R.concat(config.plugins, [
      commonjs({
        'node_modules/folktale/result/index.js': ['Result', 'Error', 'Ok'],
        'node_modules/folktale/maybe/index.js': ['Just'],
        'node_modules/folktale/concurrency/task/index.js': ['task', 'rejected', 'of']
      }),
      babel(),
      json()
    ])
  }
  /*
  // ES
  {
    output: {
      dir: 'esm',
      format: 'esm',
      indent: true,
      source: false
    },
    external: [
      ...externals,
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: R.concat(config.plugins, [
      json()
    ])
  }
  // ES for Browsers
  {
    output: {
      dir: 'esm',
      chunkFileNames: "[name]-[hash].mjs",
      entryFileNames: "[name].mjs",
      format: 'esm',
      indent: true,
      source: true
    },
    external: [
      ...externals,
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: R.concat(config.plugins, [
      nodeResolve({}),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false
        }
      }),
      json
    ])
  }
  */
]);
export default configs;
