import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'index.js',
  output: {
    name: 'Mivm',
    file: 'dist/mivm.js',
    format: 'umd'
  },
  plugins: [nodeResolve(), commonjs()],
};
