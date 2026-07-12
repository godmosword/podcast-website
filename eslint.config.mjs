import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "next-env.d.ts",
      "node_modules/**",
      "public/candy-kart/**",
      "public/stories/**",
      "test-results/**",
      "models/**",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
  {
    // React compiler rules are useful for new code, but these existing
    // browser-sync and game-loop patterns need a separate behavior-preserving
    // refactor before they can be enabled across the whole app.
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
