/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Remotion renderer and its bundler are heavy, native-ish server-only
  // packages. Keep them out of the webpack server bundle so Next doesn't try
  // to trace/bundle the esbuild + compositor binaries.
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
    "remotion",
  ],
  experimental: {
    // Photo uploads arrive as base64 inside the submit payload (prototype
    // simplification — production uses a presigned S3 PUT instead).
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
