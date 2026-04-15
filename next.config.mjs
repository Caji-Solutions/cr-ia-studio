/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remotion packages use Node.js internals — excluir do bundle do webpack
  // Next.js 14: chave experimental; promovida a top-level apenas no Next.js 15
  experimental: {
    serverComponentsExternalPackages: [
      '@remotion/renderer',
      '@remotion/bundler',
      'better-sqlite3',
    ],
  },

  webpack(config, { isServer }) {
    if (isServer) {
      // Evita que o webpack processe os internals do Remotion
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        '@remotion/bundler',
        '@remotion/renderer',
        'better-sqlite3',
      ]
    }
    return config
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control',  value: 'on' },
          { key: 'X-Frame-Options',          value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          {
            key:   'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key:   'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      // API routes: disallow caching sensitive responses
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ]
  },
}

export default nextConfig
