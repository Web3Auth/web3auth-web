<template>
  <div class="grid grid-cols-12 h-full">
    <div class="col-span-3 p-6">
      <Config @set-ui-config="setUiConfig"/>
    </div>
    <div class="col-span-9 p-6">
      <div class="mb-6">
        <button v-if="isLoggedIn" type="button" class="app-btn" @click="logout">Log out</button>
        <button v-else type="button" class="app-btn" @click="connect">Login</button>
      </div>
       <div>
        <CodeDisplay :ui-config="uiConfig" />
       </div>
    </div>
  </div>
</template>

<script lang="ts">
import { UIConfig, Web3Auth } from "@web3auth/web3auth";
import { ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA } from "@web3auth/base";
import type { SafeEventEmitterProvider } from "@web3auth/base";

import CodeDisplay from "./code.vue";
import Config from "./config.vue";



import { defineComponent } from "vue";


let web3auth: Web3Auth;


export default defineComponent({
    name: "App",
    data(): {
        uiConfig: {
            appLogo: string | undefined;
            theme: "dark" | "light" | undefined;
            loginMethodsOrder: string[] | undefined;
        };
        provider: SafeEventEmitterProvider | null;
    } {
      return {
          uiConfig: {
              appLogo: "https://images.web3auth.io/login-google.svg",
              theme: "light",
              loginMethodsOrder: undefined,
          },
          provider: null,
        };
    },
    async mounted() {
      // Initialize Modal
      await this.initWhitelabledModal();
    },
    computed: {
        isLoggedIn(): boolean {
            return !!this.provider;
        },
    },
    methods: {
        async initWhitelabledModal() {
            try {
                web3auth = new Web3Auth({
                  uiConfig: this.uiConfig,
                  chainConfig: { chainNamespace: CHAIN_NAMESPACES.EIP155 },
                  clientId: "example-client-id",
                });
                this.subscribeAuthEvents(web3auth);
                await web3auth.initModal({});
            }
            catch (error) {
                console.log("error", error);
            }
        },
        async connect() {
            try {
                this.provider = await web3auth.connect();
            }
            catch (error) {
                console.error(error);
            }
        },
        async logout() {
            await web3auth.logout();
            this.provider = null;
        },
        subscribeAuthEvents(web3auth: Web3Auth) {
            web3auth.on(ADAPTER_STATUS.CONNECTED, (data: CONNECTED_EVENT_DATA) => {
                console.log("connected to wallet", data);
                this.provider = web3auth.provider;
            });
            web3auth.on(ADAPTER_STATUS.CONNECTING, () => {
                console.log("connecting");
            });
            web3auth.on(ADAPTER_STATUS.DISCONNECTED, () => {
                console.log("disconnected");
            });
            web3auth.on(ADAPTER_STATUS.ERRORED, (error) => {
                console.error("error", error);
            });
        },
        setUiConfig(uiConfig: UIConfig) {
          console.log("setUiConfig", uiConfig)
          this.uiConfig = { ...this.uiConfig, ...uiConfig };
          this.initWhitelabledModal();
        }
    },
    components: { CodeDisplay, Config }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
}
.app-text-field {
  @apply rounded-lg outline-none w-full py-2 px-5 border border-gray-500 text-gray-700 focus:ring-1 focus:ring-app-primary focus:border-app-primary;
}
.app-btn {
  @apply py-2 px-5 w-full outline-none text-base text-app-primary bg-white rounded-lg border border-app-primary hover:bg-gray-100 focus:ring-1 focus:ring-app-primary;
}
</style>
