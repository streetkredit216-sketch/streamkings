/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'piratekingdomapp.s3.amazonaws.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/radio/:path*',
        destination: 'http://localhost:4000/radio/:path*',
      },
    ];
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
}

module.exports = nextConfig 