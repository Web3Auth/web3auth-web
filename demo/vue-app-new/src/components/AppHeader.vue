<script setup lang="ts">
import { Button } from "@toruslabs/vue-components";
import { useWeb3Auth, useWeb3AuthDisconnect } from "@web3auth/modal/vue";
import { useI18n } from "petite-vue-i18n";
import { watch } from "vue";
import { formDataStore } from "../store/form";
import { CONNECTOR_INITIAL_AUTHENTICATION_MODE } from "@web3auth/no-modal";

const { log } = console;
const { t } = useI18n({ useScope: "global" });

const { status, isConnected, isAuthorized } = useWeb3Auth();
const { disconnect } = useWeb3AuthDisconnect();
const formData = formDataStore;

const isDisplay = (name: string): boolean => {
  switch (name) {
    case "btnLogout":
      return formData.initialAuthenticationMode === CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN ? isAuthorized.value : isConnected.value;

    case "appHeading":
      return formData.initialAuthenticationMode === CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN ? isAuthorized.value : isConnected.value;

    default: {
      return false;
    }
  }
};

watch(status, () => {
  log("status :::::::::::::::::::::::::::", status.value);
});
</script>

<template>
  <nav class="bg-white sticky w-full z-20 top-0 start-0 border-gray-200 dark:border-gray-600">
    <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
      <a href="#" class="flex items-center space-x-3 rtl:space-x-reverse">
        <img :src="`/web3auth.svg`" class="h-8" alt="W3A Logo" />
      </a>
      <div class="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
        <Button v-if="isDisplay('btnLogout')" block size="xs" pill variant="tertiary" @click="() => disconnect()">
          {{ t("app.btnLogout") }}
        </Button>
        <Button v-else block size="xs" pill variant="secondary" @click="() => {}">
          {{ t("app.documentation") }}
        </Button>
      </div>
      <div id="navbar-sticky" class="items-center justify-between w-full md:flex md:w-auto md:order-1 text-center">
        <div v-if="isDisplay('appHeading')" class="max-sm:w-full max-sm:mt-4">
          <h1 class="leading-tight text-2xl sm:text-3xl font-bold">{{ $t("app.title") }}</h1>
          <p class="leading-tight text-lg sm:text-xl">{{ $t("app.description") }}</p>
        </div>
      </div>
    </div>
  </nav>
</template>
