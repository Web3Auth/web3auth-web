<template>
  <div id="app">
    <h2>Login with Web3Auth and Ethereum</h2>
    <Loader :isLoading="loading"></Loader>

    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button class="rpcBtn" v-if="!provider" @click="connect" style="cursor: pointer">Connect</button>
      <button class="rpcBtn" v-if="provider" @click="logout" style="cursor: pointer">Logout</button>
      <button class="rpcBtn" v-if="provider" @click="getUserInfo" style="cursor: pointer">Get User Info</button>
      <button class="rpcBtn" v-if="provider" @click="authenticateUser" style="cursor: pointer">Get Auth Id token</button>
      <EthRpc :connectedAdapter="web3auth.connectedAdapterName" v-if="provider" :provider="provider" :console="console"></EthRpc>
      <span>{{ connecting }}</span>

      <!-- <button @click="showError" style="cursor: pointer">Show Error</button> -->
    </section>
    <div id="console" style="white-space: pre-line">
      <p style="white-space: pre-line"></p>
    </div>
  </div>
</template>

<script lang="ts">
import { post } from "@toruslabs/http-helpers";
import { OPENLOGIN_NETWORK_TYPE } from "@toruslabs/openlogin";
import { ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA, CustomChainConfig, LoginMethodConfig } from "@web3auth/base";
import { CoinbaseAdapter } from "@web3auth/coinbase-adapter";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
// import { LOGIN_MODAL_EVENTS } from "@web3auth/ui";
import { Web3Auth } from "@web3auth/web3auth";
// import { TorusWalletConnectorPlugin } from "@web3auth/torus-wallet-connector-plugin";
import BN from "bn.js";
import { ec as EC } from "elliptic";
import { Client } from "tss-client";
import * as tss from "tss-lib";
import Vue from "vue";
const ec = new EC("secp256k1");
import { io, Socket } from "socket.io-client";

import Loader from "@/components/loader.vue";

import config from "../config";
import EthRpc from "../rpc/ethRpc.vue";

const tssServerEndpoint = "https://swaraj-test-coordinator-1.k8.authnetwork.dev/tss";
const tssImportURL = "https://cloudflare-ipfs.com/ipfs/QmWxSMacBkunyAcKkjuDTU9yCady62n3VGW2gcUEcHg6Vh";

const ethChainConfig: Partial<CustomChainConfig> & Pick<CustomChainConfig, "chainNamespace"> = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x1",
  // rpcTarget: `https://ropsten.infura.io/v3/776218ac4734478c90191dde8cae483c`,
  // displayName: "ropsten",
  // blockExplorer: "https://ropsten.etherscan.io/",
  ticker: "ETH",
  tickerName: "Ethereum",
};

async function getPublicKeyFromTSSShare(tssShare: string, signatures: string[]): Promise<string> {
  // check if TSS is available
  if (!tssShare || !Array.isArray(signatures) || signatures.length === 0) {
    throw new Error("tssShare or signatures not available");
  }
  const parsedTSSShare = {
    share: tssShare.split("-")[0].split(":")[1],
    index: tssShare.split("-")[1].split(":")[1],
  };
  const parsedSignature: {
    sig: { r: string; s: string; recoveryParam: number };
    data: {
      exp: number;
      scope: string;
      temp_key_x: string;
      temp_key_y: string;
      verifier_id: string;
      verifier_name: string;
    };
  }[] = signatures.map(function (a) {
    return JSON.parse(a as string);
  });

  // get tssPubKey
  const { verifier_name: verifierName, verifier_id: verifierId, temp_key_x: tmpKeyX } = parsedSignature[0].data;
  if (!verifierName || !verifierId) {
    throw new Error("verifier_name and verifier_id must be specified");
  }

  const { share_pub_x: sharePubX, share_pub_y: sharePubY } = await post<{
    share_pub_x: string;
    share_pub_y: string;
  }>(`${tssServerEndpoint}/getOrCreateTSSPub`, {
    verifier_name: verifierName,
    verifier_id: verifierId,
  });

  const getLagrangeCoeff = (partyIndexes: BN[], partyIndex: BN): BN => {
    let upper = new BN(1);
    let lower = new BN(1);
    for (let i = 0; i < partyIndexes.length; i += 1) {
      const otherPartyIndex = partyIndexes[i];
      if (!partyIndex.eq(otherPartyIndex)) {
        upper = upper.mul(otherPartyIndex.neg());
        upper = upper.umod(ec.curve.n);
        let temp = partyIndex.sub(otherPartyIndex);
        temp = temp.umod(ec.curve.n);
        lower = lower.mul(temp).umod(ec.curve.n);
      }
    }

    const delta = upper.mul(lower.invm(ec.curve.n)).umod(ec.curve.n);
    return delta;
  };

  // TODO: extend
  const localIndex = 1;
  const remoteIndex = 0;
  const parties = [0, 1];
  const pubKeyPoint = ec
    .keyFromPublic({ x: sharePubX, y: sharePubY })
    .getPublic()
    .mul(
      getLagrangeCoeff(
        parties.map((p) => new BN(p + 1)),
        new BN(remoteIndex + 1)
      )
    )
    .add(
      ec
        .keyFromPrivate(Buffer.from(parsedTSSShare.share.padStart(64, "0"), "hex"))
        .getPublic()
        .mul(
          getLagrangeCoeff(
            parties.map((p) => new BN(p + 1)),
            new BN(localIndex + 1)
          )
        )
    );
  const pubKeyX = pubKeyPoint.getX().toString(16, 64);
  const pubKeyY = pubKeyPoint.getY().toString(16, 64);
  const pubKeyHex = `${pubKeyX}${pubKeyY}`;
  const pubKey = Buffer.from(pubKeyHex, "hex").toString("base64");

  return pubKey;
}

async function createSockets(wsEndpoints: (string | null | undefined)[]): Promise<(Socket | null)[]> {
  const sockets = wsEndpoints.map((wsEndpoint) => {
    if (wsEndpoint === null || wsEndpoint === undefined) {
      return null;
    }
    const origin = new URL(wsEndpoint).origin;
    const path = `${new URL(wsEndpoint).pathname}/socket.io/`;
    return io(origin, { path });
  });

  await new Promise((resolve) => {
    const timer = setInterval(() => {
      for (let i = 0; i < sockets.length; i++) {
        const socket = sockets[i];
        if (socket === null) continue;
        if (!socket.id) return;
      }
      clearInterval(timer);
      resolve(true);
    }, 500);
  });

  return sockets;
}

async function setupTSS(tssShare: string, pubKey: string, verifierName: string, verifierId: string): Promise<Client> {
  const endpoints = [tssServerEndpoint, null];
  const wsEndpoints = [tssServerEndpoint, null];
  const sockets = await createSockets(wsEndpoints);
  const parsedTSSShare = {
    share: tssShare.split("-")[0].split(":")[1],
    index: tssShare.split("-")[1].split(":")[1],
  };

  const base64Share = Buffer.from(parsedTSSShare.share.padStart(64, "0"), "hex").toString("base64");
  // TODO: extend
  const localIndex = 1;
  const remoteIndex = 0;
  const parties = [0, 1];

  return new Client(`${verifierName}~${verifierId}:${Date.now()}`, localIndex, parties, endpoints, sockets, base64Share, pubKey, true, tssImportURL);
}

export default Vue.extend({
  name: "EthereumChain",
  props: {
    plugins: {
      type: Object,
      default: () => ({}),
    },
    adapterConfig: {
      type: Object,
    },
    openloginNetwork: {
      type: String,
      default: "testnet",
    },
  },
  watch: {
    adapterConfig: async function (newVal, oldVal) {
      // watch it
      console.log("Prop changed: ", newVal, " | was: ", oldVal);
      await this.initEthAuth();
    },
    openloginNetwork: async function (newVal, oldVal) {
      // watch it
      console.log("Prop changed: ", newVal, " | was: ", oldVal);
      await this.initEthAuth();
    },
  },
  data() {
    return {
      modalConfig: {},
      loading: false,
      loginButtonStatus: "",
      connecting: false,
      provider: undefined,
      web3auth: new Web3Auth({ chainConfig: { chainNamespace: CHAIN_NAMESPACES.EIP155 }, clientId: config.clientId, enableLogging: true }),
    };
  },
  components: {
    EthRpc,
    Loader,
  },

  async mounted() {
    await this.initEthAuth();
  },
  methods: {
    parseConfig() {
      this.adapterConfig.adapter.forEach((adapterConf) => {
        this.modalConfig[adapterConf.id] = {
          name: adapterConf.name,
          showOnModal: adapterConf.checked,
        };
        if (adapterConf.id === "openlogin") {
          const loginMethodsConfig: LoginMethodConfig = {};
          this.adapterConfig.login.forEach((loginProvider) => {
            loginMethodsConfig[loginProvider.id] = {
              name: loginProvider.name,
              showOnModal: loginProvider.checked,
            };
          });
          this.modalConfig[adapterConf.id] = {
            ...this.modalConfig[adapterConf.id],
            loginMethods: loginMethodsConfig,
          };
        }
      });
    },
    async initEthAuth() {
      try {
        this.parseConfig();
        this.loading = true;
        this.web3auth = new Web3Auth({
          chainConfig: ethChainConfig,
          clientId: config.clientId,
          authMode: "DAPP",
          enableLogging: true,
        });

        let getTSSData: () => Promise<{
          tssShare: string;
          signatures: string[];
        }>;
        const tssGetPublic = async () => {
          if (!getTSSData) {
            throw new Error("tssShare / sigs are undefined");
          }
          const { tssShare, signatures } = await getTSSData();
          const pubKey = await getPublicKeyFromTSSShare(tssShare, signatures);
          return Buffer.from(pubKey, "base64");
        };
        const clients: { client: Client; allocated: boolean }[] = [];
        const tssSign = async (msgHash: Buffer) => {
          for (let i = 0; i < clients.length; i++) {
            const client = clients[i];
            if (!client.allocated) {
              client.allocated = true;
              await client.client;
              await tss.default(tssImportURL);
              const { r, s, recoveryParam } = await client.client.sign(tss as any, Buffer.from(msgHash).toString("base64"), true, "", "keccak256");
              return { v: recoveryParam + 27, r: Buffer.from(r.toString("hex"), "hex"), s: Buffer.from(s.toString("hex"), "hex") };
            }
          }
          throw new Error("no available clients, please generate precomputes first");
        };
        const generatePrecompute = async (verifierName: string, verifierId: string) => {
          if (!getTSSData) {
            throw new Error("tssShare and signatures are not defined");
          }
          const { tssShare, signatures } = await getTSSData();
          const pubKey = (await tssGetPublic()).toString("base64");
          const client = await setupTSS(tssShare, pubKey, verifierName, verifierId);
          await tss.default(tssImportURL);
          client.precompute(tss as any);
          await client.ready;
          clients.push({ client, allocated: false });
        };
        (window as any).generatePrecompute = generatePrecompute;
        const openloginAdapter = new OpenloginAdapter({
          loginSettings: {
            mfaLevel: "mandatory",
          },
          tssSettings: {
            useTSS: true,
            tssGetPublic,
            tssSign,
            tssDataCallback: async (tssDataReader) => {
              getTSSData = tssDataReader;
            },
          },
          adapterSettings: {
            _iframeUrl: "https://mpc-beta.openlogin.com",
            network: "development",
            clientId: config.clientId,
          },
        });
        (window as any).openloginAdapter = openloginAdapter;

        const coinbaseAdapter = new CoinbaseAdapter({
          adapterSettings: { appName: "Web3Auth Example" },
        });

        this.web3auth.configureAdapter(openloginAdapter);
        this.web3auth.configureAdapter(coinbaseAdapter);
        // if (this.plugins["torusWallet"]) {
        //   const torusPlugin = new TorusWalletConnectorPlugin({
        //     torusWalletOpts: {},
        //     walletInitOptions: {
        //       whiteLabel: {
        //         theme: { isDark: true, colors: { primary: "#00a8ff" } },
        //         logoDark: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
        //         logoLight: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
        //       },
        //       useWalletConnect: true,
        //       enableLogging: true,
        //     },
        //   });
        //   await this.web3auth.addPlugin(torusPlugin);
        // }
        this.subscribeAuthEvents(this.web3auth);

        await this.web3auth.initModal({ modalConfig: this.modalConfig });
      } catch (error) {
        console.log("error", error);
        this.console("error", error);
      } finally {
        this.loading = false;
      }
    },
    subscribeAuthEvents(web3auth: Web3Auth) {
      web3auth.on(ADAPTER_STATUS.CONNECTED, async (data: CONNECTED_EVENT_DATA) => {
        this.console("connected to wallet", data);
        this.provider = web3auth.provider;
        this.loginButtonStatus = "Logged in";
      });
      web3auth.on(ADAPTER_STATUS.CONNECTING, () => {
        this.console("connecting");
        this.connecting = true;
        this.loginButtonStatus = "Connecting...";
      });
      web3auth.on(ADAPTER_STATUS.DISCONNECTED, () => {
        this.console("disconnected");
        this.loginButtonStatus = "";
        this.provider = undefined;
      });
      web3auth.on(ADAPTER_STATUS.ERRORED, (error) => {
        console.log("error", error);
        this.console("errored", error);
        this.loginButtonStatus = "";
      });
      // web3auth.on(LOGIN_MODAL_EVENTS.MODAL_VISIBILITY, (isVisible) => {
      //   this.connecting = isVisible;
      // });
    },
    async connect() {
      try {
        const web3authProvider = await this.web3auth.connect();
        this.provider = web3authProvider;
      } catch (error) {
        console.error(error);
        this.console("error", error);
      }
    },

    async logout() {
      await this.web3auth.logout();
      this.provider = undefined;
    },
    async getUserInfo() {
      const userInfo = await this.web3auth.getUserInfo();
      this.console(userInfo);
    },
    async authenticateUser() {
      const idTokenDetails = await this.web3auth.authenticateUser();
      this.console(idTokenDetails);
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
