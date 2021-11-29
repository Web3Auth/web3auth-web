<template>
  <div id="app">
    <h3>Login With Web3Auth</h3>
    
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button v-if="!connected" @click="loginWithTorusWallet" style="cursor: pointer;">{{ loginButtonStatus }} (Login with Torus Wallet)</button>
      <button v-if="!connected" @click="loginWithOpenlogin" style="cursor: pointer;">{{ loginButtonStatus }} (Login with Openlogin)</button>
      <button v-if="connected" @click="logout" style="cursor: pointer;">logout</button>

    </section>
    <div id="console" style="white-space: pre-line">
      <p style="white-space: pre-line"></p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Web3Auth, getTorusEvmWallet, getOpenloginWallet, WALLET_ADAPTERS } from "@web3auth/core";
import { BASE_WALLET_EVENTS, CHAIN_NAMESPACES, SafeEventEmitterProvider } from "@web3auth/base";

const web3auth = new Web3Auth(CHAIN_NAMESPACES.EIP155)
export default Vue.extend({
  name: "app",
  data() {
    return {
      loginButtonStatus: "",
      connected: false
    };
  },
  async mounted() {
    this.subscribeAuthEvents()
     // if will connect to any already logged in wallet
    const torusWalletAdapter = getTorusEvmWallet({ chainConfig: {
      host: "rinkeby",
      chainId: 4
    }, widgetOptions: {}, initParams: {}})
    
    const openloginAdapter = getOpenloginWallet({ chainConfig: {
      rpcTarget: "https://mainnet.infura.io/v3/776218ac4734478c90191dde8cae483c",
      chainId: "0x1",
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      networkName: "mainnet",
      ticker: "eth",
      tickerName: "ethereum",
    }, openLoginOptions: {
      network: "testnet",
      clientId: "localhost-id",
      uxMode: "popup"
    }, loginSettings: {
      loginProvider: "google"
    }})
    web3auth.addWallet(torusWalletAdapter).addWallet(openloginAdapter);
    await web3auth.init();
    (window as any).web3Auth = web3auth
    if (web3auth.cachedWallet) {
      await web3auth.connectTo(web3auth.cachedWallet)
    }
    this.connected = web3auth.connected
  },
  methods: {
    async loginWithOpenlogin(){
      await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN_WALLET)
    },
    async loginWithTorusWallet(){
      await web3auth.connectTo(WALLET_ADAPTERS.TORUS_EVM_WALLET)
    },
     async logout(){
      await web3auth.logout();
    },
    subscribeAuthEvents() {
      web3auth.on(BASE_WALLET_EVENTS.CONNECTED, (provider: SafeEventEmitterProvider)=>{
       console.log("connected to wallet")
       this.loginButtonStatus = "Logged in"
       this.connected = true
      })
      web3auth.on(BASE_WALLET_EVENTS.CONNECTING, ()=>{
        console.log("connecting")
        this.loginButtonStatus = "Connecting..."

      })
      web3auth.on(BASE_WALLET_EVENTS.DISCONNECTED, ()=>{
        console.log("disconnected")
        this.loginButtonStatus = ""
        this.connected = false
      })
      web3auth.on(BASE_WALLET_EVENTS.ERRORED, ()=>{
        console.log("errored")
        this.loginButtonStatus = ""
      })
    },
  },
  
});
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
#console {
  border: 0px solid black;
  height: 40px;
  padding: 2px;
  text-align: left;
  width: calc(100% - 20px);
  border-radius: 5px;
  margin-top: 20px;
  margin-bottom: 80px;
}
#console > p {
  margin: 0.5em;
}
button {
  height: 25px;
  margin: 5px;
  background: none;
  border-radius: 5px;
}
</style>
