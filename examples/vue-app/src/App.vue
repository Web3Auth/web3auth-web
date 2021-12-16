<template>
  <div id="app">
    <h3>Login With Web3Auth</h3>
    
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button v-if="!connected" @click="connect" style="cursor: pointer;">{{ loginButtonStatus }} Connect</button>
      <button v-if="!connected" @click="loginWithTorusWallet" style="cursor: pointer;">{{ loginButtonStatus }} (Login with Torus Wallet)</button>
      <button v-if="!connected" @click="loginWithOpenlogin" style="cursor: pointer;">{{ loginButtonStatus }} (Login with Openlogin)</button>
      <button v-if="connected" @click="logout" style="cursor: pointer;">logout</button>
      <button v-if="connected && provider && namespace === 'solana'" @click="signAndSendTransaction" style="cursor: pointer;">Sign and send Transaction</button>
      <button v-if="connected && provider && namespace === 'eip155'" @click="sendEth" style="cursor: pointer;">Send Eth</button>
      <button v-if="connected && provider && namespace === 'eip155'" @click="signEthMessage" style="cursor: pointer;">Sign eth message</button>

    </section>
    <div id="console" style="white-space: pre-line">
      <p style="white-space: pre-line"></p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { getCustomauthWallet, getOpenloginWallet, getTorusSolanaWallet, WALLET_ADAPTERS } from "@web3auth/core";
import { Web3AuthModal } from "@web3auth/modal";
import { BASE_WALLET_EVENTS, CHAIN_NAMESPACES, SafeEventEmitterProvider, EVM_WALLET_ADAPTERS, LOGIN_PROVIDER } from "@web3auth/base";
import { SolanaProviderWrapper } from "@web3auth/solana-provider"
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, Message } from "@solana/web3.js";
import bs58 from "bs58";
import Web3 from "web3"
const web3auth = new Web3AuthModal(CHAIN_NAMESPACES.EIP155)
export default Vue.extend({
  name: "app",
  data() {
    return {
      loginButtonStatus: "",
      connected: false,
      provider: undefined,
      namespace: undefined
    };
  },
  async mounted() {
    try {
    this.subscribeAuthEvents()

    this.namespace = web3auth.chainNamespace
  
    const openloginAdapter = getOpenloginWallet({ chainConfig: {
      rpcTarget: "https://polygon-rpc.com",
      chainId: "0x89",
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      networkName: "matic",
      ticker: "matic",
      tickerName: "matic",
    }, adapterSettings: {
      network: "testnet",
      clientId: "localhost-id",
      uxMode: "redirect"
    }, loginSettings: {
      // loginProvider: "google"
    }})


    const customAuthAdapter = getCustomauthWallet({
      initSettings: {
        skipInit: true,
        skipSw: true,
        skipPrefetch: true
      },
      chainConfig: {
      rpcTarget: "https://api.testnet.solana.com",
      chainId: "0x2",
      chainNamespace: CHAIN_NAMESPACES.SOLANA,
      networkName: "mainnet",
      ticker: "sol",
      tickerName: "solana",
    }, adapterSettings: {
      baseUrl: window.location.origin,
      redirectPathName:"",
      uxMode: "redirect",
      enableLogging: true,
      network: "testnet", // details for test net
      popupFeatures: `titlebar=0,toolbar=0,status=0,location=0,menubar=0,height=500,width=500,top=100,left=100`,
    }, loginSettings: {
      // loginProvider: "google"
      "loginProviderConfig": {
        "google": {
          "clientId": "221898609709-obfn3p63741l5333093430j3qeiinaa8.apps.googleusercontent.com",
          "verifier": "google-lrc",
        }
      }
    }
    })
    
    // const openloginAdapter = getOpenloginWallet({ chainConfig: {
    //   rpcTarget: "https://api.devnet.solana.com",
    //   chainId: "0x3",
    //   chainNamespace: CHAIN_NAMESPACES.SOLANA,
    //   networkName: "devnet",
    //   ticker: "sol",
    //   tickerName: "solana",
    // }, adapterSettings: {
    //   network: "testnet",
    //   clientId: "localhost-id",
    //   uxMode: "popup"
    // }, loginSettings: {
    //   // loginProvider: "google"
    // }})

    // const torusWalletAdapter = getTorusSolanaWallet({
    //   initParams: {
    //     buildEnv: "development"
    //   }
    // })
    web3auth.configureWallet(openloginAdapter);
    // web3auth.configureWallet(torusWalletAdapter);

    await web3auth.initModal({
      modalConfig: {
        // [WALLET_ADAPTERS.CUSTOM_AUTH]: { visible: false }
      }
    });
    // (window as any).web3Auth = web3auth
    // if (web3auth.cachedWallet) {
    //   await web3auth.connectTo(web3auth.cachedWallet)
    // }

    web3auth.loginModal.on("LOGIN", (params) => {
      // eslint-disable-next-line no-console
      console.log("LOGIN", params);
    });
    web3auth.loginModal.on("INIT_EXTERNAL_WALLETS", ({ externalWalletsInitialized }) => {
      // eslint-disable-next-line no-console
      console.log("INIT_EXTERNAL_WALLETS", externalWalletsInitialized);
    });

    this.connected = web3auth.connected
    } catch (error) {
      console.log("error", error)
    }
  },
  methods: {
    connect() {
      web3auth.connect()
    },
    async signAndSendTransaction() {
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
      console.log("provider", this.provider)
      console.log("transaction", transaction, pubKey)
      // const decodedTx = bs58.decode(bs58.encode(transaction.serializeMessage()));
      // const tx = Transaction.populate(Message.from(decodedTx));
      const signature = await solWeb3.signAndSendTransaction(transaction)
      console.log("signature", signature);
    },
    async sendEth() {
      const pubKey = await this.provider.request({ method: "eth_accounts" })
      console.log("pubKey", pubKey)
      const web3 = new Web3(this.provider);
      const blockNumber = await this.provider.request({ method: "eth_getBlockByNumber", params: ["latest", false] })
      console.log("eth_getBlockByNumber", blockNumber)
      await web3.eth.sendTransaction({ from: pubKey[0], to: pubKey[0], value: web3.utils.toWei("0.01") })
        // .then((resp) => this.console(resp))
        // .catch(console.error);
    },
    async signEthMessage() {
      const pubKey = await this.provider.request({ method: "eth_accounts" })
      console.log("pubKey", pubKey)
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
            return console.error(err);
          }
          console.log("sign message => true", result);
        }
      );
    },
    async loginWithOpenlogin(){
      await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN_WALLET)
    },
    async loginWithTorusWallet(){
      await web3auth.connectTo(WALLET_ADAPTERS.TORUS_EVM_WALLET)
    },
     async logout(){
      await web3auth.logout();
      this.provider = undefined
    },
    subscribeAuthEvents() {
      web3auth.on(BASE_WALLET_EVENTS.CONNECTED, (adapterName: string)=>{
       console.log("connected to wallet", adapterName, web3auth.provider)
       this.provider = web3auth.provider;
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
      web3auth.on(BASE_WALLET_EVENTS.ERRORED, (error)=>{
        console.log("errored", error)
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
