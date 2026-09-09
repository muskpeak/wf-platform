/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@wf-platform/uikit", "@wf-platform/web3-core", "@wf-platform/integrations-polymarket", "@wf-platform/integrations-lottery"],
  output: "standalone",
  experimental: {
    optimizePackageImports: ['viem', '@privy-io/react-auth', '@zerodev/sdk', 'lucide-react'],
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Provide Node.js fallbacks for Web3 libraries (like viem/ox)
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "worker_threads": false,
      fs: false,
      net: false,
      tls: false,
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
