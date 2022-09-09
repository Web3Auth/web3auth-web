<template>
  <Openlogin v-if="authType === 'openlogin'" />
  <!-- <WalletConnect v-else-if="authType === 'walletConnect'" /> -->
</template>

<script lang="ts">
import Vue from "vue";

import Openlogin from "./openlogin.vue";
// import WalletConnect from "./walletConnect.vue";

export default Vue.extend({
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
