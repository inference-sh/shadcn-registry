import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // `next dev` is reached through the ui-dev.inference.sh tunnel, which Next 16
  // treats as a foreign origin and blocks from loading /_next/* dev resources.
  // Without this the client bundle never loads: the page renders but nothing
  // hydrates, so clicks and input do nothing and no requests are made.
  // Dev-only — has no effect on the production standalone build.
  allowedDevOrigins: ["ui-dev.inference.sh"],
};

export default nextConfig;
