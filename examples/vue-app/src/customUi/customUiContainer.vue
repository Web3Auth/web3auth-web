<template>
  <!-- <Openlogin v-if="authType === 'customAuth'" /> -->
  <CustomAuth />
  <!-- <WalletConnect v-else-if="authType === 'walletConnect'" /> -->
</template>

<script lang="ts">
import Vue from "vue";

import CustomAuth from "./customAuth.vue";
// import Openlogin from "./openlogin.vue";
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
    // Openlogin,
    CustomAuth,
    // WalletConnect,
  },
  async mounted() {
    console.log("chain", this.chain);
  },
  methods: {},
});
</script>
