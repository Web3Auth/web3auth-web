<template>
  <div id="app">
    <h3>Login With Web3Auth</h3>
    
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button @click="login" style="cursor: pointer;">{{ loginButtonStatus }}</button>
     
    </section>
    <div id="console" style="white-space: pre-line">
      <p style="white-space: pre-line"></p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Web3Auth, getTorusWallet } from "@web3auth/core";
import { BASE_WALLET_EVENTS } from "@web3auth/base";

const web3auth = new Web3Auth()
export default Vue.extend({
  name: "app",
  data() {
    return {
      loginButtonStatus: "Login"
    };
  },
  async mounted() {
    this.subscribeAuthEvents()
     // if will connect to any already logged in wallet
    const torusWalletAdapter = getTorusWallet({ widgetOptions: {}, initParams: {}})
    web3auth.addWallet(torusWalletAdapter);
    await web3auth.init();
    if (web3auth.cachedWallet) {
      await web3auth.connectTo(web3auth.cachedWallet)
    }
  },
  methods: {
    async login(){
      await web3auth.connectTo("torus-wallet")
    },
    subscribeAuthEvents() {
      web3auth.on(BASE_WALLET_EVENTS.CONNECTED, ()=>{
       console.log("connected")
       this.loginButtonStatus = "Logged in"
      })
      web3auth.on(BASE_WALLET_EVENTS.CONNECTING, ()=>{
          console.log("connecting")
        this.loginButtonStatus = "Connecting..."
      })
      web3auth.on(BASE_WALLET_EVENTS.DISCONNECTED, ()=>{
        console.log("disconnected")
        this.loginButtonStatus = "Login"
      })
      web3auth.on(BASE_WALLET_EVENTS.ERRORED, ()=>{
        console.log("errored")
        this.loginButtonStatus = "Login"
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
