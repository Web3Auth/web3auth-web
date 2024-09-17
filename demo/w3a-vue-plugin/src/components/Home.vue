<script setup lang="ts">
// import { useWeb3Auth } from '@web3auth/modal-vue-composables';
// import { useWalletServicesPlugin } from '@web3auth/wallet-services-plugin-vue-composables';
import { watch } from 'vue';
import { useWeb3Auth } from '../lib/useWeb3Auth';
import { useWeb3AuthWallet } from '../lib/useWeb3AuthWallet';

const { isInitialized, connect, initError, isConnected, logout } = useWeb3Auth()
const { isPluginConnected, showWalletUI } = useWeb3AuthWallet()

watch(initError, (initErrorNew) => {
  console.log(initErrorNew)
})
watch(isInitialized, (isInitializedNew) => {
  console.log(isInitializedNew)
})
watch(isConnected, (isConnectedNew) => {
  console.log(isConnectedNew)
})
</script>

<template>
  <div>
    <button v-if="isConnected" @click="logout">Log out</button>
    <button v-else :disabled="!isInitialized" @click="connect">Connect</button>
    <button :disabled="!isPluginConnected" @click="showWalletUI">Show Wallet UI</button>
  </div>
</template>

<style scoped>
</style>
