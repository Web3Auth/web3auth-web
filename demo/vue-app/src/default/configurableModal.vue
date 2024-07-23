<template>
  <div id="app">
    <ChainContainer :plugins="plugins" :openlogin-network="openloginNetwork" :adapter-config="adapterConfig" :chain="chain"></ChainContainer>
    <div id="console" style="white-space: pre-line">
      <code style="white-space: pre-line"></code>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import ChainContainer from "../chains/chainContainer.vue";

export default defineComponent({
  name: "ConfigurableExample",
  components: {
    ChainContainer,
  },
  props: {
    chain: {
      type: String,
      default: "ethereum",
    },
    plugins: {
      type: Object,
      default: () => ({}),
    },
    adapterConfig: {
      type: Object,
      default: () => ({}),
    },
    openloginNetwork: {
      type: String,
      default: "testnet",
    },
  },
  data() {
    return {};
  },
});
</script>
