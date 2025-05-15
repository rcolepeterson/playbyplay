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
};

module.exports = nextConfig;
