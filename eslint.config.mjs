import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    // New React-Compiler-era rules (eslint-plugin-react-hooks 7, shipped with
    // eslint-config-next 16) flag pre-existing patterns in admin + the 3D
    // preview (refs mutated in useFrame, setState in mount effects, plain <a>
    // in admin). Kept visible as warnings; fix when those files are touched.
    rules: {
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".shots/**",
    "public/**",
    "design/**",
    "research/**",
    "assets-src/**",
  ]),
]);
