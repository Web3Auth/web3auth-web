<template>
  <div v-if="loading" class="flex flex-col items-center justify-center">
    <Loader useSpinner :size="80" />
  </div>
  <div v-else class="flex flex-col items-center justify-center">
    <h2 class="text-2xl font-bold text-app-gray-900">Login with Web3Auth and Ethereum</h2>
    <Button v-if="!provider" variant="secondary" pill class="connect-btn mt-4 w-[320px]" @click="connect">Connect</Button>
    <div class="flex gap-4 items-center w-full mt-4">
      <Button v-if="provider" variant="secondary" pill block class="connect-btn" @click="logout">Logout</Button>
      <Button v-if="provider" variant="secondary" pill block class="connect-btn" @click="getUserInfo">Get User Info</Button>
      <Button v-if="provider" variant="secondary" pill block class="connect-btn" @click="authenticateUser">Get Auth Id token</Button>
    </div>
    <EthRpc :connectedAdapter="Web3Auth.connectedAdapterName" v-if="provider" :provider="provider" :console="console" :web3auth="Web3Auth"></EthRpc>
    <div id="console" style="white-space: pre-line" class="mt-10 console-container bg-app-gray-200 shadow-md rounded-lg p-4">
      <p style="white-space: pre-line" class="text-xs font-normal break-words console-inner-container overflow-y-auto overflow-x-auto"></p>
    </div>
  </div>
</template>

<script lang="ts">
import { OPENLOGIN_NETWORK_TYPE } from "@toruslabs/openlogin-utils";
import { Button, Loader } from "@toruslabs/vue-components";
import { ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA, CustomChainConfig, LoginMethodConfig } from "@web3auth/base";
import { WALLET_ADAPTERS } from "@web3auth/base";
// import { LOGIN_MODAL_EVENTS } from "@web3auth/ui";
import { Web3Auth } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { TorusWalletConnectorPlugin } from "@web3auth/torus-wallet-connector-plugin";
import { getWalletConnectV2Settings, WalletConnectV2Adapter } from "@web3auth/wallet-connect-v2-adapter";
import { defineComponent } from "vue";

// import Loader from "@/components/loader.vue";
import config from "../config";
import EthRpc from "../rpc/ethRpc.vue";

const ethChainConfig: Partial<CustomChainConfig> & Pick<CustomChainConfig, "chainNamespace"> = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x1",
  ticker: "ETH",
  tickerName: "Ethereum",
};

let web3AuthInstance = null;

const getWeb3Auth = (openloginNetwork: string) => {
  if (!web3AuthInstance) {
    web3AuthInstance = new Web3Auth({
      chainConfig: { chainNamespace: CHAIN_NAMESPACES.EIP155 },
      clientId: config.clientId[openloginNetwork],
      enableLogging: true,
      authMode: "DAPP",
      web3AuthNetwork: openloginNetwork as OPENLOGIN_NETWORK_TYPE,
    });
  }
  return web3AuthInstance;
};

const logOutWeb3Auth = () => {
  if (web3AuthInstance) {
    web3AuthInstance.logout();
  }
};

export default defineComponent({
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
      loginMethods: {},
      loading: false,
      loginButtonStatus: "",
      connecting: false,
      provider: null,
      Web3Auth: null,
    };
  },
  components: {
    EthRpc,
    Loader,
    Button,
  },
  async mounted() {
    await this.initEthAuth();
  },
  methods: {
    parseConfig() {
      console.log(this.adapterConfig, "ETH");
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
      // this.adapterConfig.login.forEach((login) => {
      //   if (login.checked) {
      //     this.loginMethods[login.id] = {
      //       name: login.id,
      //       showOnModal: login.checked,
      //     };
      //   }
      // });
    },
    async initEthAuth() {
      try {
        this.parseConfig();
        console.log(this.modalConfig, this.loginMethods, "MODAL");
        this.loading = true;
        const web3auth = getWeb3Auth(this.openloginNetwork);
        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            network: this.openloginNetwork as OPENLOGIN_NETWORK_TYPE,
            clientId: config.clientId[this.openloginNetwork],
          },
        });
        // by default, web3auth modal uses wallet connect v1,
        // if you want to use wallet connect v2, configure wallet-connect-v2-adapter
        // as shown below.
        // NOTE: if you will configure both wc1 and wc2, precedence will be given to wc2
        const defaultWcSettings = await getWalletConnectV2Settings(
          ethChainConfig.chainNamespace,
          [parseInt(ethChainConfig.chainId, 16), parseInt("0x89", 16), 5],
          "04309ed1007e77d1f119b85205bb779d"
        );
        console.log("defaultWcSettings", JSON.stringify(defaultWcSettings));
        const wc2Adapter = new WalletConnectV2Adapter({
          adapterSettings: { ...defaultWcSettings.adapterSettings },
          chainConfig: ethChainConfig,
          loginSettings: defaultWcSettings.loginSettings,
        });

        web3auth.configureAdapter(wc2Adapter);

        web3auth.configureAdapter(openloginAdapter);
        if (this.plugins["torusWallet"]) {
          const torusPlugin = new TorusWalletConnectorPlugin({
            torusWalletOpts: {},
            walletInitOptions: {
              whiteLabel: {
                theme: { isDark: true, colors: { primary: "#00a8ff" } },
                logoDark: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
                logoLight: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
              },
              useWalletConnect: true,
              enableLogging: true,
            },
          });
          await web3auth.addPlugin(torusPlugin);
        }
        this.subscribeAuthEvents(web3auth);

        await web3auth.initModal({
          modalConfig: {
            [WALLET_ADAPTERS.METAMASK]: {
              showOnDesktop: true,
              showOnModal: true,
              showOnMobile: true,
              label: "Metamask",
            },
            [WALLET_ADAPTERS.WALLET_CONNECT_V1]: {
              showOnDesktop: true,
              showOnModal: true,
              showOnMobile: true,
              label: "Wallet Connect",
            },
            [WALLET_ADAPTERS.TORUS_EVM]: {
              showOnDesktop: true,
              showOnModal: true,
              showOnMobile: true,
              label: "Torus",
            },
            [WALLET_ADAPTERS.OPENLOGIN]: {
              showOnDesktop: true,
              showOnModal: true,
              showOnMobile: true,
              label: "OpenLogin",
            },
          },
        });
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
        // this.provider = undefined;
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
        const web3authProvider = await getWeb3Auth(this.openloginNetwork);
        const webProvider = await web3authProvider.connect();
        this.Web3Auth = web3authProvider;
        this.provider = webProvider;
      } catch (error) {
        console.error(error);
        this.console("error", error);
      }
    },

    async logout() {
      await logOutWeb3Auth();
      this.provider = undefined;
    },
    async getUserInfo() {
      const userInfo = await getWeb3Auth(this.openloginNetwork).getUserInfo();
      this.console(userInfo);
    },
    async authenticateUser() {
      const idTokenDetails = await getWeb3Auth(this.openloginNetwork).authenticateUser();
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

<style scoped>
.connect-btn {
  border-color: #6f717a !important;
  color: #6f717a !important;
}
.console-container {
  width: 500px;
  height: 350px;
}
.console-inner-container {
  width: 468px;
  height: 328px;
}
</style>
