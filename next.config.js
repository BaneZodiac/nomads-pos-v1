/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { domains: ['localhost'] },
  experimental: { serverComponentsExternalPackages: ['bcryptjs', '@prisma/client', 'prisma'] },
}

module.exports = nextConfig
