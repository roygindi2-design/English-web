/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // T-461 · F-321ⓐ — the keyboard's route reads the generated tree at runtime.
  outputFileTracingIncludes: {
    '/api/world/messages/continuations': ['./data/generated/continuations.json'],
  },
};
export default nextConfig;
