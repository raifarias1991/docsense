/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy todas as chamadas /api/v1/* para o backend FastAPI.
  // Usa a variável de ambiente SERVER-SIDE API_URL (não exposta ao browser).
  // Configure API_URL nos env vars do Netlify/Vercel/servidor.
  async rewrites() {
    const backendUrl = process.env.API_URL || 'http://localhost:8000'
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ]
  },
}

export default nextConfig
