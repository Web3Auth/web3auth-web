<script setup lang="ts">
import { computed } from 'vue';
import Web3AuthProvider, { Web3AuthContextConfig, } from '@web3auth/modal-vue-composables'
import Main from './MainView.vue';
import { chainOptions } from './config';
import { EthereumPrivateKeyProvider, } from "@web3auth/ethereum-provider";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from '@web3auth/base';
import { type Web3AuthOptions } from "@web3auth/modal";

const w3AOptions = computed((): Web3AuthContextConfig => {
  const ethereumPrivateKeyProvider = new EthereumPrivateKeyProvider({
    config: {
      chainConfig: chainOptions[CHAIN_NAMESPACES.EIP155][0],
    },
  });
  const options: Web3AuthOptions = {
    clientId: "BHgArYmWwSeq21czpcarYh0EVq2WWOzflX-NTK-tY1-1pauPzHKRRLgpABkmYiIV_og9jAvoIxQ8L3Smrwe04Lw",
    privateKeyProvider: ethereumPrivateKeyProvider,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    // chainConfig?: CustomChainConfig;
    // enableLogging?: boolean;
    // storageKey?: "session" | "local";
    // sessionTime?: number;
    // useCoreKitKey?: boolean;
    // uiConfig: enabledWhiteLabel ? { ...whiteLabel } : undefined,
  }
  return {
    web3AuthOptions: options
  }
})

</script>

<template>
  <Web3AuthProvider :config="w3AOptions">
    <Main />
  </Web3AuthProvider>
</template>
