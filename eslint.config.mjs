import coreWebVitals from "eslint-config-next/core-web-vitals";

const config = [...coreWebVitals, { ignores: [".next/**", "public/ocr/**", "node_modules/**"] }];

export default config;
