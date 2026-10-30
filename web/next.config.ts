import type { NextConfig } from "next";

let basePath = process.env.BASE_PATH || "";
if (basePath) {
  // Normalize if path conversion mangled it on Windows/MSYS
  if (!basePath.startsWith("/")) {
    basePath = "/" + (basePath.split(/[/\\]/).pop() || "");
  }
  basePath = basePath.replace(/\/+$/, "");
}

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: basePath ? basePath : undefined,
  assetPrefix: basePath ? basePath : undefined,
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
