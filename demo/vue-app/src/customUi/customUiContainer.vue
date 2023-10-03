<template>
  <Openlogin v-if="authType === 'openlogin'" />
  <!-- <WalletConnect v-else-if="authType === 'walletConnect'" /> -->
</template>

<script lang="ts">
import { defineComponent } from "vue";

import Openlogin from "./openlogin.vue";
// import WalletConnect from "./walletConnect.vue";

export default defineComponent({
  name: "CustomUiContainer",
  props: {
    authType: {
      type: String,
      default: "openlogin",
    },
  },
  data() {
    return {};
  },
  components: {
    Openlogin,
    // WalletConnect,
  },
  methods: {},
});
</script>
