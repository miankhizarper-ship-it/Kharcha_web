import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Pin the file-tracing root to THIS project. Without it, a stray lockfile in
// a PARENT directory (e.g. a monorepo bun.lock) makes Next infer the wrong
// workspace root, and the standalone build output (.next/standalone) that
// the OpenNext Cloudflare bundler consumes gets nested one level too deep —
// failing with "ENOENT ... .next/standalone/.next/server/pages-manifest.json".
const projectDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["mongodb"],
  outputFileTracingRoot: projectDir,
};

export default nextConfig;
