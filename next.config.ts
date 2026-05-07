import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        // Allow any hostname for agent-hosted profile images
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    // Defensive HTTP security headers applied to every response.
    // CSP is intentionally omitted — Next.js inline scripts make a strict CSP
    // brittle; we'll add it once we're ready to test thoroughly.
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
      },
      // HSTS reinforcement (Vercel sets this too, but pinning here makes it explicit)
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ];

    return [
      {
        source: "/api/v1/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, PATCH, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          ...securityHeaders,
        ],
      },
      {
        // Apply to every other route (pages + static assets)
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
