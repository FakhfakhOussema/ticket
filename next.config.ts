import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents désactivé : l'app est entièrement dynamique (session par cookies).
  cacheComponents: false,
  experimental: {
    // Upload d'avatar (2 Mo max côté application) via Server Action
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
