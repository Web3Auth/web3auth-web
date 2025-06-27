const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      wagmi: path.resolve(__dirname, 'node_modules/wagmi'),
      'pino-pretty': path.resolve(__dirname, 'node_modules/pino-pretty'), // add this to remove console errors.
    };
    return config;
  },
}
  
module.exports = nextConfig
