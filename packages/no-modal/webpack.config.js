const path = require("path");
const generateWebpackConfig = require("../../webpack.config");

const config = generateWebpackConfig({
  alias: {
    // Base path
    "@/core/base": path.resolve(__dirname, "src/base"),

    // Connector paths
    "@/core/auth-connector": path.resolve(__dirname, "src/connectors/auth-connector"),
    "@/core/base-evm-connector": path.resolve(__dirname, "src/connectors/base-evm-connector"),
    "@/core/base-solana-connector": path.resolve(__dirname, "src/connectors/base-solana-connector"),
    "@/core/coinbase-connector": path.resolve(__dirname, "src/connectors/coinbase-connector"),
    "@/core/injected-evm-connector": path.resolve(__dirname, "src/connectors/injected-evm-connector"),
    "@/core/injected-solana-connector": path.resolve(__dirname, "src/connectors/injected-solana-connector"),
    "@/core/wallet-connect-v2-connector": path.resolve(__dirname, "src/connectors/wallet-connect-v2-connector"),

    // Plugin paths
    "@/core/nft-checkout-plugin": path.resolve(__dirname, "src/plugins/nft-checkout-plugin"),
    "@/core/solana-wallet-connector-plugin": path.resolve(__dirname, "src/plugins/solana-wallet-connector-plugin"),
    "@/core/wallet-services-plugin": path.resolve(__dirname, "src/plugins/wallet-services-plugin"),

    // Provider paths
    "@/core/base-provider": path.resolve(__dirname, "src/providers/base-provider"),
    "@/core/solana-provider": path.resolve(__dirname, "src/providers/solana-provider"),
    "@/core/ethereum-provider": path.resolve(__dirname, "src/providers/ethereum-provider"),
    "@/core/ethereum-mpc-provider": path.resolve(__dirname, "src/providers/ethereum-mpc-provider"),
    "@/core/xrpl-provider": path.resolve(__dirname, "src/providers/xrpl-provider"),
    "@/core/account-abstraction-provider": path.resolve(__dirname, "src/providers/account-abstraction-provider"),
  },
});

module.exports = config;
