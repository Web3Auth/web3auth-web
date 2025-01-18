import tsConfigPaths from "rollup-plugin-tsconfig-paths"
import { nodeResolve } from '@rollup/plugin-node-resolve';


export default {
  // ... other config options ...
  plugins: [
    // ... other plugins ...
    tsConfigPaths({ tsConfigPath: '../../tsconfig.json' }),
    nodeResolve(),
  ],
};
