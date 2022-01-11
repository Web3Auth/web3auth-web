<template>
  <div id="app">
    <h3>Login With Web3Auth</h3>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
    </section>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <ChainContainer :chain="chain"></ChainContainer>
    </section>
    <div id="console" style="white-space: pre-line">
      <p style="white-space: pre-line"></p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
// import { OpenloginAdapter } from "@web3auth/openlogin-adapter"
// import { CustomAuthAdapter } from "@web3auth/customauth-adapter"
// import { SolanaWalletAdapter } from "@web3auth/torus-solana-adapter"

// import { Web3Auth } from "@web3auth/web3auth";
// import { ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA } from "@web3auth/base";

import ChainContainer from "../chains/chainContainer.vue";

export default Vue.extend({
  name: "ConfigurableExample",
  props: {
    chain: {
        type: String,
        default: "ethereum"
    }
  },
  data() {
    return {
    //   loading: false,
    //   loginButtonStatus: "",
    //   connected: false,
    //   provider: undefined,
    //   namespace: undefined,
    //   web3auth: new Web3Auth({chainConfig: {  chainNamespace: CHAIN_NAMESPACES.EIP155 }, clientId: "localhost-id" })
    };
  },
  components: {
    ChainContainer
},
  async mounted() {
    // try {
    //   this.loading=true
    //   const namespace = localStorage.getItem("chainNamespace")
    //   if (namespace === 'solana') {
    //     await this.initSolanaAuth();
    //   } else {
    //     await this.initEthAuth();
    //   }
    // } finally {
    //   this.loading=false
    // }
  },
  methods: {
    // async initSolanaAuth() {
    //   try {
    //     this.web3auth = new Web3Auth({ chainConfig: { chainId: "0x3", chainNamespace: CHAIN_NAMESPACES.SOLANA }, clientId: "localhost-id" })
    //     this.subscribeAuthEvents(this.web3auth)

    //     this.namespace = this.web3auth.options.chainConfig.chainNamespace
      
    //     const customAuthAdapter = new CustomAuthAdapter({
    //       chainConfig:{
    //         chainNamespace: this.namespace,
    //         blockExplorer: "https://explorer.solana.com",
    //         chainId: "0x1",
    //         displayName: "Solana Mainnet",
    //         rpcTarget: "https://solana-mainnet.phantom.tech",
    //         ticker: "SOL",
    //         tickerName: "Solana Token",
    //       },
    //       adapterSettings: {
    //         network: "testnet",
    //         baseUrl: window.location.origin,
    //         redirectPathName:"auth",
    //       }, loginSettings: {
    //       // loginProvider: "google"
    //       "loginProviderConfig": {
    //         "google": {
    //           method: "triggerLogin",
    //           args: {
    //             typeOfLogin: "google",
    //             verifier: "google-lrc",
    //             clientId: "221898609709-obfn3p63741l5333093430j3qeiinaa8.apps.googleusercontent.com",
    //           }
    //         },
    //         "twitter": {
    //           method: "triggerLogin",
    //           args: {
    //             typeOfLogin: "twitter",
    //             "clientId": "A7H8kkcmyFRlusJQ9dZiqBLraG2yWIsO", 
    //             "verifier": "torus-auth0-twitter-lrc" ,
    //             jwtParams: {
    //               "domain": "https://torus-test.auth0.com"
    //             }
    //           }
            
    //         }
    //       }
    //     }
    //     })

    //     const torusWalletAdapter = new SolanaWalletAdapter({
    //       initParams: {
    //         buildEnv: "testing"
    //       }
    //     })
    //     // this.web3auth.configureAdapter(customAuthAdapter);
    //     this.web3auth.configureAdapter(torusWalletAdapter);
    //   await this.web3auth.initModal({});
    //   } catch (error) {
    //     this.console("error", error)
    //   }
    // },
    // async initEthAuth() {
    //   try {
    //     this.web3auth = new Web3Auth({ chainConfig: { chainNamespace: CHAIN_NAMESPACES.EIP155 }, clientId: "localhost-id"})
    //     this.subscribeAuthEvents(this.web3auth)

    //     this.namespace = this.web3auth.options.chainConfig.chainNamespace
      
    //     const openloginAdapter = new OpenloginAdapter({adapterSettings: {
    //       network: "testnet",
    //       clientId: "localhost-id",
    //       uxMode: "redirect"
    //     }})

    //     this.web3auth.configureAdapter(openloginAdapter);

    //     await (this.web3auth as Web3Auth).initModal({
    //       // modalConfig: {
    //       //   [WALLET_ADAPTERS.CUSTOM_AUTH]: { showOnModal: false }
    //       // }
    //     });
    //   } catch (error) {
    //     console.log("error", error);
    //     this.console("error sss", error)
    //   }
    
    // },
    // async switchChain() {
    //   if (this.namespace === 'solana') {
    //     await this.initEthAuth();
    //     localStorage.setItem("chainNamespace", this.namespace)
    //   } else if (this.namespace === 'eip155') {
    //     await this.initSolanaAuth();
    //     localStorage.setItem("chainNamespace", this.namespace)
    //   }
    // },
    // connect() {
    //   try {
    //     this.web3auth.connect()
    //     console.log("web3auth", this.web3auth)
    //     // (window as any).web3auth = this.web3auth
    //   } catch (error) {
    //     console.error(error)
    //     this.console("error", error)
    //   }
    // },
    // async logout(){
    //   await this.web3auth.logout();
    //   this.provider = undefined
    // },
    // async getUserInfo(){
    //   const userInfo = await this.web3auth.getUserInfo();
    //   this.console(userInfo)
    // },
    // subscribeAuthEvents(web3auth: Web3Auth) {
    //   web3auth.on (ADAPTER_STATUS.CONNECTED, (data: CONNECTED_EVENT_DATA)=>{
    //    this.console("connected to wallet", data)
    //    this.provider = web3auth.provider;
    //    this.loginButtonStatus = "Logged in"
    //    this.connected = true
    //   })
    //   web3auth.on(ADAPTER_STATUS.CONNECTING, ()=>{
    //     this.console("connecting")
    //     this.loginButtonStatus = "Connecting..."

    //   })
    //   web3auth.on(ADAPTER_STATUS.DISCONNECTED, ()=>{
    //     console.log("disconnected")
    //     this.console("disconnected")
    //     this.loginButtonStatus = ""
    //     this.connected = false
    //   })
    //   web3auth.on(ADAPTER_STATUS.ERRORED, (error)=>{
    //             console.log("errroed")
    //     this.console("errored", error)
    //     this.loginButtonStatus = ""
    //   })
    //   web3auth.on(ADAPTER_STATUS.READY, ()=>{
    //             console.log("ready")
    //     this.console("ready")
    //     this.loginButtonStatus = ""
    //   })
    // },
    // console(...args: unknown[]): void {
    //   const el = document.querySelector("#console>p");
    //   if (el) {
    //     el.innerHTML = JSON.stringify(args || {}, null, 2);
    //   }
    // },
  },
});
</script>

