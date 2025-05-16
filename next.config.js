/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...existing config...
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // or higher, e.g. '50mb'
    },
    // ...other experimental options...
  },
  // ...existing config...
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
