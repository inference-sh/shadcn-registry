import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // `next dev` is reached through the ui-dev.inference.sh tunnel, which Next 16
  // treats as a foreign origin and blocks from loading /_next/* dev resources.
  // Without this the client bundle never loads: the page renders but nothing
  // hydrates, so clicks and input do nothing and no requests are made.
  // Dev-only — has no effect on the production standalone build.
  allowedDevOrigins: ["ui-dev.inference.sh"],

  // Do NOT add `turbopack: { root: __dirname }` here.
  //
  // `next dev` warns that it inferred the workspace root, because both js/ and
  // js/ui contain a pnpm-workspace.yaml. The warning is cosmetic — Next picks
  // js/ and everything resolves. Setting turbopack.root to silence it breaks
  // the dev server instead: CSS `@import "tailwindcss"` starts resolving from
  // js/, where tailwindcss is not installed, and every page fails with
  // "Can't resolve 'tailwindcss'". Production builds are unaffected, so it
  // looks harmless until someone runs pnpm dev.
};

export default nextConfig;
