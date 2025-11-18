import process from "node:process";

import withPWAInit from "next-pwa";
import runtimeCaching from "next-pwa/cache.js";

const isDev = process.env.NODE_ENV === "development";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  cacheStartUrl: true,
  disable: isDev,
  runtimeCaching: [
    ...runtimeCaching,
    {
      urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "oru-api-cache",
        networkTimeoutSeconds: 8,
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 5,
        },
        cacheableResponse: {
          statuses: [0, 200, 201],
        },
      },
    },
    {
      urlPattern: /https:\/\/fonts\.gstatic\.com\/.*/,
      handler: "CacheFirst",
      method: "GET",
      options: {
        cacheName: "oru-fonts",
        expiration: {
          maxEntries: 8,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
  ],
  fallbacks: {
    document: "/offline",
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    instrumentationHook: false,
  },
};

export default withPWA(nextConfig);
