/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workstation attachments, owner credentials and generated media must never
  // be deployment dependencies, including builds performed on an owner's PC.
  outputFileTracingExcludes: {
    // Owner session reads also run on public pages for GEO preview. Keep the
    // immutable authoring inputs out of every function; public runtime assets
    // remain served normally. These inputs are never read by application code.
    '/*': ['./assets-source/**/*', './social/output/**/*', './social/.tmp/**/*', './.youtube-oauth/**/*', './.env*'],
  },
  async headers() {
    const headers = [
      { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
    ]
    return [{ source: '/owner/:path*', headers }, { source: '/api/owner/:path*', headers }]
  },
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
