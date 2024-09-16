<script setup lang="ts">
import { Web3AuthProvider } from "@web3auth/modal-vue-composables";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import Home from "./components/Home.vue";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { WalletServicesProvider } from "@web3auth/wallet-services-plugin-vue-composables";

const clientId = "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ"; // get from https://dashboard.web3auth.io

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7",
  rpcTarget: "https://rpc.ankr.com/eth_sepolia",
  // Avoid using public rpcTarget in production.
  // Use services like Infura, Quicknode etc
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig: chainConfig }
});

const walletServicesPlugin = new WalletServicesPlugin()
</script>

<template>
  <Web3AuthProvider
    :config="{
      web3AuthOptions: {
        clientId,
        web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
        privateKeyProvider,
      },
      plugins: [walletServicesPlugin]
    }"
  >
    <WalletServicesProvider>
      <Home />
    </WalletServicesProvider>
  </Web3AuthProvider>
</template>

<style scoped></style>
