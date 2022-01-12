<template>
  <div id="app">
    <h3>Login With Web3Auth</h3>
    <section
      :style="{
        fontSize: '12px',
      }"
    ></section>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <ChainContainer :adapterConfig="adapterConfig" :chain="chain"></ChainContainer>
    </section>
    <div id="console" style="white-space: pre-line">
      <p style="white-space: pre-line"></p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import ChainContainer from "../chains/chainContainer.vue";

export default Vue.extend({
  name: "ConfigurableExample",
  props: {
    chain: {
      type: String,
      default: "ethereum",
    },
    adapterConfig: {
      type: Object,
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
