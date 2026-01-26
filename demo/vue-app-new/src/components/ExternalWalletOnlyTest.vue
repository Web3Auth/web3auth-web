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
  <div class="flex flex-col gap-3">
    <!-- Connect Button -->
    <div v-if="!isConnected">
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Test external wallet connection (isolated instance with AUTH hidden).
      </p>
      <Button @click="connect">Connect External Wallet Only</Button>
    </div>

    <!-- Dashboard after connection -->
    <div v-else class="flex flex-col gap-4">
      <Card class="p-4" :shadow="false">
        <div class="text-lg font-bold mb-3">Connected Wallet</div>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div class="text-gray-500">Connector:</div>
          <div class="font-medium">{{ connectorName }}</div>
          <div class="text-gray-500">Address:</div>
          <div class="font-medium font-mono">{{ truncateAddress(address) }}</div>
          <div class="text-gray-500">Balance:</div>
          <div class="font-medium">{{ balance }}</div>
        </div>
      </Card>
      <Button variant="tertiary" @click="disconnect">Disconnect</Button>
    </div>
  </div>
</template>
