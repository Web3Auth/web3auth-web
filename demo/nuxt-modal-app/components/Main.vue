<template>
  <div class="container">
    <h1>Web3Auth Nuxt.js Demo</h1>
    <div v-if="!isConnected">
      <button @click="() => connect()">Login</button>
    </div>
    <div v-else>
      <p>Connected!</p>
      <p>Address: {{ address }}</p>
      <button @click="() => disconnect()">Logout</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWeb3Auth, useWeb3AuthConnect, useWeb3AuthDisconnect } from '@web3auth/modal/vue'
import { useAccount, useConnect, useDisconnect } from '@wagmi/vue'

const { isConnected } = useWeb3Auth()
const { address, isConnected: isWagmiConnected } = useAccount()
const { connect } = useWeb3AuthConnect()
const { disconnect } = useWeb3AuthDisconnect()

watch(isWagmiConnected, (newVal) => {
  console.log('isWagmiConnected', newVal)
}, { immediate: true })

</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

button {
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 4px;
}
</style>
