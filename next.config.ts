import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enforce HTTPS in production
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "header",
            key: "x-forwarded-proto",
            value: "http", // If behind proxy
          },
        ],
        destination: "https://:host/:path*",
        permanent: true,
      },
    ];
  },

  // Security headers
  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";
    
    const apiUrl = isDevelopment
      ? "http://localhost:8000"
      : "https://api.mutual.example.com";

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains", // 1 year HTTPS
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Content-Security-Policy",
            value: isDevelopment
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http://localhost:8000 ws://localhost:3000; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
              : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.mutual.example.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
            // value: [
            //   "default-src 'self'",
            //   "script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'",
            //   "style-src 'self' 'unsafe-inline'",
            //   "img-src 'self' data: https:",
            //   // "font-src 'self' data:",
            //   `connect-src 'self' ${apiUrl}`,
            //   "frame-ancestors 'none'",
            //   "base-uri 'self'",
            //   "form-action 'self'",
            // ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
