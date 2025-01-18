const path = require('path');
const generateWebpackConfig = require("../../webpack.config");

const config = generateWebpackConfig({
  alias: {
    // Base path
    '@/core/base': path.resolve(__dirname, 'src/base'),
      
    // Adapter paths
    '@/core/auth-adapter': path.resolve(__dirname, 'src/adapters/auth-adapter'),
    '@/core/base-evm-adapter': path.resolve(__dirname, 'src/adapters/base-evm-adapter'),
    '@/core/base-solana-adapter': path.resolve(__dirname, 'src/adapters/base-solana-adapter'),
    '@/core/coinbase-adapter': path.resolve(__dirname, 'src/adapters/coinbase-adapter'),
    '@/core/default-evm-adapter': path.resolve(__dirname, 'src/adapters/default-evm-adapter'),
    '@/core/default-solana-adapter': path.resolve(__dirname, 'src/adapters/default-solana-adapter'),
    '@/core/torus-evm-adapter': path.resolve(__dirname, 'src/adapters/torus-evm-adapter'),
    '@/core/torus-solana-adapter': path.resolve(__dirname, 'src/adapters/torus-solana-adapter'),
    '@/core/wallet-connect-v2-adapter': path.resolve(__dirname, 'src/adapters/wallet-connect-v2-adapter'),
    
    // Plugin paths
    '@/core/nft-checkout-plugin': path.resolve(__dirname, 'src/plugins/nft-checkout-plugin'),
    '@/core/solana-wallet-connector-plugin': path.resolve(__dirname, 'src/plugins/solana-wallet-connector-plugin'),
    '@/core/wallet-services-plugin': path.resolve(__dirname, 'src/plugins/wallet-services-plugin'),
    
    // Provider paths
    '@/core/base-provider': path.resolve(__dirname, 'src/providers/base-provider'),
    '@/core/solana-provider': path.resolve(__dirname, 'src/providers/solana-provider'),
    '@/core/ethereum-provider': path.resolve(__dirname, 'src/providers/ethereum-provider'),
    '@/core/ethereum-mpc-provider': path.resolve(__dirname, 'src/providers/ethereum-mpc-provider'),
    '@/core/xrpl-provider': path.resolve(__dirname, 'src/providers/xrpl-provider')
  },
});


module.exports = config;
