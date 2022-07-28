<template>
  <div id="w3a-example-modal" class="w3a-example-modal" v-if="isLoading">
    <div class="w3ajs-modal-loader w3a-example-modal__loader">
      <div class="w3a-example-modal__loader-content">
        <div class="w3a-example-modal__loader-info">
          <div class="w3ajs-modal-loader__spinner w3a-spinner">
            <div class="w3a-spinner__body"></div>
            <div class="w3a-spinner__cover"></div>
            <div class="w3a-spinner__head"></div>
          </div>
          <div class="w3ajs-modal-loader__label w3a-spinner-label"></div>
          <div class="w3ajs-modal-loader__message w3a-spinner-message" style="display: none"></div>
        </div>
        <div class="w3a-spinner-power">
          <img src="https://images.web3auth.io/web3auth.svg" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "LoaderComponent",
  props: {
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {};
  },
});
</script>
