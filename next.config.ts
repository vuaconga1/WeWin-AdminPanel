import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Nested under wewin-ielts — pin tracing to this app.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
