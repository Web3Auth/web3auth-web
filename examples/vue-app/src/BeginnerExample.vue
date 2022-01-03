<template>
  <div id="app">
    <h3>Login With Web3Auth</h3>
    <h3>Connect with {{ namespace === 'solana' ? `${namespace} web3auth` : 'ethereum web3auth' }} </h3>
      <div id="w3a-modal" class="w3a-modal" v-if="loading">
        <div class="w3ajs-modal-loader w3a-modal__loader">
          <div class="w3a-modal__loader-content">
              <div class="w3a-modal__loader-info">
                <div class="w3ajs-modal-loader__spinner w3a-spinner">
                    <div class="w3a-spinner__body"></div>
                    <div class="w3a-spinner__cover"></div>
                    <div class="w3a-spinner__head"></div>
                </div>
                <div class="w3ajs-modal-loader__label w3a-spinner-label"></div>
                <div class="w3ajs-modal-loader__message w3a-spinner-message" style="display: none"></div>
              </div>
              <div class="w3a-spinner-power">
                <loaderSvg/>
              </div>
          </div>
          <button class="w3a-header__button w3ajs-loader-close-btn">
              <img src="${closeIcon}" alt="">
          </button>
        </div>
      </div>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button v-if="!connected" @click="switchChain" style="cursor: pointer;">Switch Chain</button>
    </section>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button v-if="!connected" @click="connect" style="cursor: pointer;">{{ loginButtonStatus }} Connect</button>
      <button v-if="connected" @click="logout" style="cursor: pointer;">logout</button>
      <button v-if="connected && provider && namespace === 'solana'" @click="signAndSendTransaction" style="cursor: pointer;">Sign and send Transaction</button>
      <button v-if="connected && provider && namespace === 'eip155'" @click="sendEth" style="cursor: pointer;">Send Eth</button>
      <button v-if="connected && provider && namespace === 'eip155'" @click="signEthMessage" style="cursor: pointer;">Sign eth message</button>
      <button v-if="connected" @click="getUserInfo" style="cursor: pointer;">Get User Info</button>

    </section>
    <div id="console" style="white-space: pre-line">
      <p style="white-space: pre-line"></p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Web3Auth } from "@web3auth/web3auth";
import { BASE_ADAPTER_EVENTS, CHAIN_NAMESPACES } from "@web3auth/base";
import { SolanaProviderWrapper } from "@web3auth/solana-provider"
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import Web3 from "web3"

import loader from "./assets/torus-power.svg"

export default Vue.extend({
  name: "BeginnerExampleMode",
  data() {
    return {
      loading: false,
      loginButtonStatus: "",
      connected: false,
      provider: undefined,
      namespace: undefined,
      web3auth: new Web3Auth({ chainNamespace: CHAIN_NAMESPACES.EIP155, clientId: "localhost-id" })
    };
  },
  components: {
    loaderSvg: loader
  },
  async mounted() {
    try {
      this.loading=true
      const namespace = localStorage.getItem("chainNamespace")
      if (namespace === 'solana') {
        await this.initSolanaAuth();
      } else {
        await this.initEthAuth();
      }
    } finally {
      this.loading=false
    }
  },
  methods: {
    async initSolanaAuth() {
      try {
        this.web3auth = new Web3Auth({ chainNamespace: CHAIN_NAMESPACES.SOLANA, chainId: 3, clientId: "localhost-id" })
        this.subscribeAuthEvents(this.web3auth)
        this.namespace = this.web3auth.options.chainNamespace
        await this.web3auth.initModal({});
      } catch (error) {
        this.console("error", error)
      }
    },
    async initEthAuth() {
      try {
        this.web3auth = new Web3Auth({ chainNamespace: CHAIN_NAMESPACES.EIP155, clientId: "localhost-id"})
        this.subscribeAuthEvents(this.web3auth)
        await (this.web3auth as Web3Auth).initModal({});
      } catch (error) {
        console.log("error", error);
        this.console("error sss", error)
      }
    
    },
    async switchChain() {
      console.log("this.namespace", this.namespace)
      if (this.namespace === 'solana') {
        await this.initEthAuth();
        localStorage.setItem("chainNamespace", this.namespace)
      } else if (this.namespace === 'eip155') {
        await this.initSolanaAuth();
        localStorage.setItem("chainNamespace", this.namespace)
      }
    },
    subscribeAuthEvents(web3auth: Web3Auth) {
      web3auth.on (BASE_ADAPTER_EVENTS.CONNECTED, (adapterName: string)=>{
       this.console("connected to wallet", adapterName)
       this.provider = web3auth.provider;
       this.loginButtonStatus = "Logged in"
       this.connected = true
      })
      web3auth.on(BASE_ADAPTER_EVENTS.CONNECTING, ()=>{
        this.console("connecting")
        this.loginButtonStatus = "Connecting..."

      })
      web3auth.on(BASE_ADAPTER_EVENTS.DISCONNECTED, ()=>{
        this.console("disconnected")
        this.loginButtonStatus = ""
        this.connected = false
      })
      web3auth.on(BASE_ADAPTER_EVENTS.ERRORED, (error)=>{
        this.console("errored", error)
        this.loginButtonStatus = ""
      })
    },
    connect() {
      try {
        this.web3auth.connect()
      } catch (error) {
        console.error(error)
        this.console("error", error)
      }
    },
    async signAndSendTransaction() {
      try {
        const conn = new Connection("https://api.devnet.solana.com")
        const solWeb3 = new SolanaProviderWrapper(this.provider)
        const pubKey = await solWeb3.requestAccounts()

        const blockhash = (await conn.getRecentBlockhash("finalized")).blockhash;
        const TransactionInstruction = SystemProgram.transfer({
          fromPubkey: new PublicKey(pubKey[0]),
          toPubkey: new PublicKey("oWvBmHCj6m8ZWtypYko8cRVVnn7jQRpSZjKpYBeESxu"),
          lamports: 0.01 * LAMPORTS_PER_SOL
        });
        let transaction = new Transaction({ recentBlockhash: blockhash, feePayer: new PublicKey(pubKey[0]) }).add(TransactionInstruction);
        const signature = await solWeb3.signAndSendTransaction(transaction)
        this.console("signature", signature)
      } catch (error) {
        this.console("error", error)
      }
    },
    async sendEth() {
      try {
        const pubKey = await this.provider.request({ method: "eth_accounts" })
        console.log("pubKey", pubKey)
        const web3 = new Web3(this.provider);
        const blockNumber = await this.provider.request({ method: "eth_getBlockByNumber", params: ["latest", false] })
        const txRes = await web3.eth.sendTransaction({ from: "0x2c7536E3605D9C16a7a3D7b1898e529396a65c23", to: pubKey[0], value: web3.utils.toWei("0.01") })
        this.console("txRes", txRes)
      } catch (error) {
        this.console("error", error)
      }
    },
    async signEthMessage() {
      try {
        const pubKey = await this.provider.request({ method: "eth_accounts" })
        const web3 = new Web3();
        web3.setProvider(this.provider)
        // hex message
        const message = "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad";
        (web3.currentProvider as any)?.send(
          {
            method: "eth_sign",
            params: [pubKey[0], message],
            from: pubKey[0],
          },
          (err: Error, result: any) => {
            if (err) {
              return this.console(err);
            }
            this.console("sign message => true", result);
          }
        );
      } catch (error) {
        this.console("error", error)
      }
    },
     async logout(){
      await this.web3auth.logout();
      this.provider = undefined
    },
    async getUserInfo(){
      const userInfo = await this.web3auth.getUserInfo();
      this.console(userInfo)
    },
    console(...args: unknown[]): void {
      const el = document.querySelector("#console>p");
      if (el) {
        el.innerHTML = JSON.stringify(args || {}, null, 2);
      }
    },
  },
  
  
});
</script>

