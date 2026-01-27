<script setup lang="ts">
import { Button, Card } from "@toruslabs/vue-components";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WALLET_CONNECTORS } from "@web3auth/no-modal";
import { ref } from "vue";

const web3auth = ref<Web3Auth | null>(null);
const isConnected = ref(false);
const address = ref("");
const balance = ref("");
const connectorName = ref("");

const connect = async () => {
  web3auth.value = new Web3Auth({
    clientId: "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ",
    web3AuthNetwork: "sapphire_mainnet",
    chains: [
      {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: "0x1",
        rpcTarget: "https://rpc.ankr.com/eth",
        displayName: "Ethereum Mainnet",
        blockExplorerUrl: "https://etherscan.io",
        ticker: "ETH",
        tickerName: "Ethereum",
        logo: "https://images.toruswallet.io/eth.svg",
      },
    ],
    multiInjectedProviderDiscovery: true,
    modalConfig: {
      hideWalletDiscovery: false,
      connectors: {
        [WALLET_CONNECTORS.AUTH]: {
          label: "Auth",
          showOnModal: false,
        },
      },
    },
    uiConfig: {
      primaryButton: "externalLogin",
    },
  });

  await web3auth.value.init();
  const provider = await web3auth.value.connect();

  if (provider) {
    isConnected.value = true;
    connectorName.value = web3auth.value.connectedConnectorName || "Unknown";

    // Get address
    const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
    address.value = accounts?.[0] || "";

    // Get balance
    if (address.value) {
      const balanceHex = (await provider.request({
        method: "eth_getBalance",
        params: [address.value, "latest"],
      })) as string;
      const balanceWei = BigInt(balanceHex);
      const balanceEth = Number(balanceWei) / 1e18;
      balance.value = balanceEth.toFixed(4) + " ETH";
    }
  }
};

const disconnect = async () => {
  if (web3auth.value) {
    await web3auth.value.logout();
    isConnected.value = false;
    address.value = "";
    balance.value = "";
    connectorName.value = "";
    web3auth.value = null;
  }
};

const truncateAddress = (addr: string) => {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};
</script>

<template>
  <div class="grid grid-cols-1 gap-2">
    <!-- Connect Button -->
    <div v-if="!isConnected">
      <p class="text-sm text-app-gray-500 dark:text-app-gray-400 mb-3">
        Test external wallet connection (isolated instance with AUTH hidden).
      </p>
      <Button block size="xs" pill @click="connect">Connect External Wallet Only</Button>
    </div>

    <!-- Dashboard after connection -->
    <div v-else class="grid grid-cols-1 gap-2">
      <Card class="px-4 py-4" :shadow="false">
        <div class="mb-2 text-xl font-bold leading-tight text-left text-app-gray-900 dark:text-app-white">Connected Wallet</div>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div class="text-app-gray-500 dark:text-app-gray-400">Connector:</div>
          <div class="font-medium text-app-gray-900 dark:text-app-white">{{ connectorName }}</div>
          <div class="text-app-gray-500 dark:text-app-gray-400">Address:</div>
          <div class="font-medium font-mono text-app-gray-900 dark:text-app-white">{{ truncateAddress(address) }}</div>
          <div class="text-app-gray-500 dark:text-app-gray-400">Balance:</div>
          <div class="font-medium text-app-gray-900 dark:text-app-white">{{ balance }}</div>
        </div>
      </Card>
      <Button block size="xs" pill variant="tertiary" @click="disconnect">Disconnect</Button>
    </div>
  </div>
</template>
