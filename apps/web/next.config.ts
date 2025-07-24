/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  },
  images: {
    domains: ["avatars.githubusercontent.com"],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/:path*`,
      },
    ];
  },

  // Enable static exports for better performance
  output: "standalone", // or 'export' if you want full static export

  // Optimize for static generation
  experimental: {
    // ppr: true,
  },

  // Configure headers for better caching
  async headers() {
    return [
      {
        source: "/docs/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
