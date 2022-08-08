<template>
    <div>
      <a href="https://github.com/Web3Auth/Web3Auth/tree/master/demo/whitelabel-app">
        <img class="mx-auto mb-2" src="@/assets/github-logo.png" width="30" />
      </a>
      <h1 class="mb-6 text-2xl font-bold">Whitelabel Settings</h1>
      <form @submit.prevent="submitConfig" class="text-left">
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
          <textarea placeholder="google, twitter, facebook" class="app-text-field" rows="5" v-model="loginMethodsOrderDisplay"></textarea>
          <div class="text-right">
            <a class="text-sm cursor-pointer text-app-primary" @click="setDefaultOrder">Set default</a>
          </div>
        </div>
        <button type="submit" class="app-btn">Submit</button>
      </form>
    </div>
</template>

<script lang="ts">

import { defineComponent } from "vue";
import { LOGIN_PROVIDER } from "@toruslabs/openlogin";


export default defineComponent({
  name: "App",
  data(): {
    uiConfig: {
      appLogo: string | undefined;
      theme: "dark" | "light" | undefined;
      loginMethodsOrder: string[] | undefined;
    };
    loginMethodsOrderDisplay: string;
  } {
    return {
      uiConfig: {
        appLogo: "https://images.web3auth.io/login-google.svg",
        theme: "light",
        loginMethodsOrder: undefined,
      },
      loginMethodsOrderDisplay: "",
    };
  },
  emits: ["setUiConfig"],
  methods: {
    async submitConfig() {
      this.$emit("setUiConfig", {
        ...this.uiConfig,
        loginMethodsOrder: this.loginMethodsOrderDisplay.length ? this.loginMethodsOrderDisplay.split(",") : undefined
      });
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
