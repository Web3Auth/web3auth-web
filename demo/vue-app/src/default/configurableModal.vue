<template>
  <div class="w-[80%]">
    <ChainContainer :plugins="plugins" :openloginNetwork="openloginNetwork" :adapterConfig="adapterConfig" :chain="chain"></ChainContainer>
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
  props: {
    chain: {
      type: String,
      default: "ethereum",
    },
    plugins: {
      type: Object,
    },
    adapterConfig: {
      type: Object,
    },
    openloginNetwork: {
      type: String,
      default: "testnet",
    },
  },
  data() {
    return {};
  },
  components: {
    ChainContainer,
  },
});
</script>
