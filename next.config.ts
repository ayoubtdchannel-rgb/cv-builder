import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer runs in route handlers only; keep it out of the bundle.
  serverExternalPackages: ["@react-pdf/renderer"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
