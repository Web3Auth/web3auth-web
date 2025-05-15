<template>
  <Web3AuthProvider :config="web3authConfig">
    <WagmiProvider>
      <slot />
    </WagmiProvider>
  </Web3AuthProvider>
</template>

<script setup lang="ts">
import { Web3AuthProvider, type Web3AuthContextConfig } from '@web3auth/modal/vue'
import { WagmiProvider } from '@web3auth/modal/vue/wagmi'

const clientId = "BKZDJP0ouZP0PtfQYssMiezINbUwnIthw6ClTtTICvh0MCRgAxi5GJbHKH9cjM6xyWxe73c6c94ASCTxbGNLUt8";

const web3authConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    enableLogging: true,
    web3AuthNetwork: "sapphire_devnet",
    clientId: clientId,
    authBuildEnv: "testing",
    ssr: true
  },
};
</script>
