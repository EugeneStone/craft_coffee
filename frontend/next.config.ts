import type { NextConfig } from 'next';

// /api/* проксируется на Express-бэкенд: фронт всегда ходит на свой же origin,
// поэтому не нужны ни CORS, ни знание адреса API в браузере.
const apiOrigin = process.env.API_ORIGIN || 'http://localhost:4001';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
