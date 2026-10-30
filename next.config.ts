import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  output: process.env.APP_STANDALONE === "true" ? "standalone" : undefined,
};
export default config;
