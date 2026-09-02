/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@wf-platform/uikit", "@wf-platform/web3-core", "@wf-platform/games-polymarket"],
  output: "standalone",
};

export default nextConfig;
