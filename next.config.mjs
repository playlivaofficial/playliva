/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // NOTE: Do not add a host-normalization redirect here. The canonical
  // production host is www.playliva.com, and Vercel already redirects the
  // apex (playliva.com) to www at the platform level. An app-level www→apex
  // redirect fights that platform redirect and produces an infinite loop
  // ("too many redirects"). Host canonicalization is owned by Vercel domain
  // settings, not the app.
}

export default nextConfig
