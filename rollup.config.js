import typescript from "rollup-plugin-typescript2";
import resolve from "rollup-plugin-node-resolve";

export default {
  input: "src/index.ts",
  output: {
    dir: "client",
    format: "umd",
    sourcemap: true,
    file: "index.js"
  },
  plugins: [
    resolve(),
    typescript({
      // Make sure we are using our version of TypeScript.
      typescript: require("typescript"),
      tsconfigOverride: {
        compilerOptions: {
          sourceMap: true
        }
      }
    })
  ]
};
