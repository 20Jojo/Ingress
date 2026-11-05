import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  // Pin the workspace root so a stray lockfile higher up the tree
  // (e.g. in the user's home folder) isn't mistaken for the project root.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
