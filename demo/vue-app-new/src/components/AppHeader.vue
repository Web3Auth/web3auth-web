<script setup lang="ts">
import { Button } from "@toruslabs/vue-components";
import { useWeb3Auth } from "@web3auth/modal-vue-composables";
import { watch } from "vue";
import { useI18n } from "vue-i18n";

const { log } = console;
const { t } = useI18n({ useScope: "global" });

const { status, logout, isConnected } = useWeb3Auth();

const onLogout = async () => {
  await logout();
};

const isDisplay = (name: string): boolean => {
  switch (name) {
    case "btnLogout":
      return isConnected.value;

    case "appHeading":
      return isConnected.value;

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
  <nav class="bg-white sticky top-0 z-50 w-full z-20 top-0 start-0 border-gray-200 dark:border-gray-600">
    <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
      <a href="#" class="flex items-center space-x-3 rtl:space-x-reverse">
        <img :src="`/web3auth.svg`" class="h-8" alt="W3A Logo" />
      </a>
      <div class="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
        <Button v-if="isDisplay('btnLogout')" block size="xs" pill variant="secondary" @click="onLogout">
          {{ t("app.btnLogout") }}
        </Button>
        <Button v-else block size="xs" pill variant="secondary" @click="() => {}">
          {{ t("app.documentation") }}
        </Button>
      </div>
      <div id="navbar-sticky" class="items-center justify-between w-full md:flex md:w-auto md:order-1">
        <div v-if="isDisplay('appHeading')" class="max-sm:w-full">
          <h1 class="leading-tight text-3xl font-extrabold">{{ $t("app.title") }}</h1>
          <p class="leading-tight text-1xl">{{ $t("app.description") }}</p>
        </div>
      </div>
    </div>
  </nav>
</template>
