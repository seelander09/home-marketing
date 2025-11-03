/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      }
    ]
  },
  typescript: {
    ignoreBuildErrors: false
  },
  eslint: {
    ignoreDuringBuilds: false
  },
  webpack: (config, { isServer }) => {
    // Exclude node:fs and node:path from client bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      }
      // Prevent webpack from trying to bundle node: prefixed modules in client
      config.externals = config.externals || []
      config.externals.push({
        'node:fs': 'commonjs node:fs',
        'node:path': 'commonjs node:path',
      })
    }
    return config
  }
}

module.exports = nextConfig
