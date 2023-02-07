<template>
  <div id="app">
    <Home></Home>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import Home from "./components/Home.vue";

export default Vue.extend({
  name: "app",
  data() {
    return {
      exampleMode: "default",
      chain: null,
      authType: null,
    };
  },
  components: {
    Home,
  },

  methods: {},
});
</script>

<style></style>
