import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  // Keep the starter on the flat config export that actually runs under the pinned ESLint/Next toolchain.
  ...nextCoreWebVitals,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      // O'zbek lotin alifbosidagi tutuq belgisi (o', g') JSX matnida doim qatnashadi.
      "react/no-unescaped-entities": "off",
      // App Router ishlatiladi: shriftlar root layout orqali ulanadi (pages/_document emas).
      "@next/next/no-page-custom-font": "off",
    },
  },
]);
