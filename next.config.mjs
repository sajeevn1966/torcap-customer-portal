/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // DATABASE_URL is intentionally NOT exposed here (no NEXT_PUBLIC_ prefix,
  // no `env` passthrough) — it is only ever read server-side by lib/prisma.ts
  // inside API routes / server components.

  // Explicitly allow accessing the DEV server from other devices on the
  // local network (e.g. testing on a phone by opening
  // http://<your-machine-IP>:3000). Add any other IP/hostname you use for
  // local testing to this list. This only affects `next dev` — it has no
  // effect on a production build.
  allowedDevOrigins: ["172.16.200.120"],
};

export default nextConfig;
