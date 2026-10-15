import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer runs in route handlers only; keep it out of the bundle.
  serverExternalPackages: ["@react-pdf/renderer"],
  // CV fonts are read from disk at render time; ship them with the PDF route.
  outputFileTracingIncludes: {
    "/api/cvs/*/pdf": ["./src/lib/pdf/fonts/**/*"],
  },
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
