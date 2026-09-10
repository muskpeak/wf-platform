import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@wf-platform/uikit", "@wf-platform/web3-core", "@wf-platform/lottery", "@wf-platform/api", "@wf-platform/auth", "@wf-platform/chain-config"],
  output: "standalone",
  experimental: {
    optimizePackageImports: ['viem', '@privy-io/react-auth', '@zerodev/sdk', 'lucide-react'],
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Provide Node.js fallbacks for Web3 libraries (like viem/ox)
    config.resolve = config.resolve || {};
    
    // Force singleton for @privy-io/react-auth to prevent React Context duplication in PNPM monorepo
    config.resolve.alias = {
      ...config.resolve.alias,
      '@privy-io/react-auth': path.resolve(process.cwd(), 'node_modules/@privy-io/react-auth'),
    };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      "worker_threads": false,
      fs: false,
      net: false,
      tls: false,
      "@farcaster/mini-app-solana": false,
      "@farcaster/frame-sdk": false,
    };

    // Suppress purely cosmetic warnings from Web3 dynamic imports
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /node_modules\/ox/,
      /node_modules\/viem/,
    ];
    
    return config;
  },
};

export default nextConfig;
