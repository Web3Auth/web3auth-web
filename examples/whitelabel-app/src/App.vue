<template>
  <div class="grid grid-cols-3 h-full">
    <div class="col-span-1 bg-gray-100 text-center p-6">
      <a href="https://github.com/Web3Auth/Web3Auth/tree/master/examples/whitelabel-app">
        <img class="mx-auto mb-2" src="@/assets/github-logo.png" width="30" />
      </a>
      <h1 class="mb-6 text-2xl font-bold">Whitelabel Settings</h1>
      <form @submit.prevent="setCode" class="text-left">
        <div class="mb-4">
          <label class="block text-base font-medium mb-2">App Logo</label>
          <input v-model="uiConfig.appLogo" class="app-text-field" type="text" placeholder="Enter logo url" />
        </div>
        <div class="mb-4">
          <label class="block text-base font-medium mb-2">Theme</label>
          <div class="flex">
            <label class="flex items-center ml-2 text-base">
              <input type="radio" v-model="uiConfig.theme" value="light" class="mr-2 w-4 h-4" />
              Light
            </label>
            <label class="flex items-center ml-2 text-base">
              <input type="radio" value="dark" v-model="uiConfig.theme" class="mr-2 w-4 h-4" />
              Dark
            </label>
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-base font-medium mb-2">Login method order</label>
          <textarea class="app-text-field" rows="5" v-model="loginMethodsOrderDisplay"></textarea>
          <div class="text-right">
            <a class="text-sm cursor-pointer text-app-primary" @click="setDefaultOrder">Set default</a>
          </div>
        </div>
        <button type="submit" class="app-btn">Submit</button>
      </form>
    </div>
    <div class="col-span-2 p-6">
      <div class="mb-6">
        <button v-if="isLoggedIn" type="button" class="app-btn" @click="logout">Log out</button>
        <button v-else type="button" class="app-btn" @click="connect">Login</button>
      </div>
      <textarea id="jsEditor"></textarea>
      <div class="text-right">
        <a class="text-sm cursor-pointer text-app-primary" @click="copyCode">Copy</a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Web3Auth } from "@web3auth/web3auth";
import { LOGIN_PROVIDER } from "@toruslabs/openlogin";
import { ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA, SafeEventEmitterProvider } from "@web3auth/base";
import copyToClipboard from "copy-to-clipboard";

import * as CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript.js";
import { format } from "prettier/standalone";
import parserBabel from "prettier/parser-babel";

import { defineComponent } from "vue";

let jsEditor: CodeMirror.Editor;
const initEditor = () => {
  jsEditor = CodeMirror.fromTextArea(document.getElementById("jsEditor") as HTMLTextAreaElement, {
    lineNumbers: true,
    theme: "dracula",
    mode: "javascript",
    readOnly: true,
  });
};

let web3auth: Web3Auth;
const initWeb3Auth = (uiConfig: { appLogo: string | undefined; theme: "dark" | "light" | undefined; loginMethodsOrder: string[] | undefined }) => {
  web3auth = new Web3Auth({
    uiConfig,
    chainConfig: { chainNamespace: CHAIN_NAMESPACES.EIP155 },
    clientId: "example-client-id",
  });
};

export default defineComponent({
  name: "App",
  data(): {
    uiConfig: {
      appLogo: string | undefined;
      theme: "dark" | "light" | undefined;
      loginMethodsOrder: string[] | undefined;
    };
    provider: SafeEventEmitterProvider | null;
    loginMethodsOrderDisplay: string;
  } {
    return {
      uiConfig: {
        appLogo: "https://images.web3auth.io/login-google.svg",
        theme: undefined,
        loginMethodsOrder: undefined,
      },
      provider: null,
      loginMethodsOrderDisplay: "",
    };
  },
  mounted() {
    initEditor();
    this.setCode();
  },
  computed: {
    isLoggedIn(): boolean {
      return !!this.provider;
    },
  },
  methods: {
    async setCode() {
      const formattedCode = this.getCode();
      jsEditor.setValue(formattedCode);

      // Initialize Modal
      await this.initWhitelabledModal();
    },
    async initWhitelabledModal() {
      const loginMethodsOrderDisplay = this.loginMethodsOrderDisplay.trim();
      this.uiConfig.loginMethodsOrder = loginMethodsOrderDisplay.length ? this.loginMethodsOrderDisplay.split(",") : undefined;

      try {
        initWeb3Auth(this.uiConfig);
        this.subscribeAuthEvents(web3auth);
        await web3auth.initModal({});
      } catch (error) {
        console.log("error", error);
      }
    },
    async connect() {
      try {
        this.provider = await web3auth.connect();
      } catch (error) {
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
    copyCode() {
      copyToClipboard(this.getCode());
    },
    setDefaultOrder() {
      const defaultOrder = [
        LOGIN_PROVIDER.GOOGLE,
        LOGIN_PROVIDER.FACEBOOK,
        LOGIN_PROVIDER.TWITTER,
        LOGIN_PROVIDER.REDDIT,
        LOGIN_PROVIDER.DISCORD,
        LOGIN_PROVIDER.TWITCH,
        LOGIN_PROVIDER.APPLE,
        LOGIN_PROVIDER.LINE,
        LOGIN_PROVIDER.GITHUB,
        LOGIN_PROVIDER.KAKAO,
        LOGIN_PROVIDER.LINKEDIN,
        LOGIN_PROVIDER.WEIBO,
        LOGIN_PROVIDER.WECHAT,
      ];
      this.loginMethodsOrderDisplay = defaultOrder.join(",");
    },
    getCode(): string {
      const loginMethodsOrderDisplay = this.loginMethodsOrderDisplay.trim();
      const uiConfig = {
        appLogo: this.uiConfig.appLogo,
        theme: this.uiConfig.theme,
        loginMethodsOrder: loginMethodsOrderDisplay.length ? this.loginMethodsOrderDisplay.split(",") : undefined,
      };
      const renderCode = `
        import { Web3Auth } from "@web3auth/web3auth";
        import { CHAIN_NAMESPACES } from "@web3auth/base";

        this.web3auth = new Web3Auth({
          uiConfig: ${JSON.stringify(uiConfig)},
          chainConfig: { chainNamespace: CHAIN_NAMESPACES.EIP155 },
          clientId: "Your client id",
        });
      `;
      return format(renderCode, { plugins: [parserBabel], parser: "babel-ts" });
    },
  },
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
