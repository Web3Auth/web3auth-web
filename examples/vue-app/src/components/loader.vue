<template>
   
    <div id="w3a-modal" class="w3a-modal" v-if="isLoading">
        <div class="w3ajs-modal-loader w3a-modal__loader">
          <div class="w3a-modal__loader-content">
              <div class="w3a-modal__loader-info">
                <div class="w3ajs-modal-loader__spinner w3a-spinner">
                    <div class="w3a-spinner__body"></div>
                    <div class="w3a-spinner__cover"></div>
                    <div class="w3a-spinner__head"></div>
                </div>
                <div class="w3ajs-modal-loader__label w3a-spinner-label"></div>
                <div class="w3ajs-modal-loader__message w3a-spinner-message" style="display: none"></div>
              </div>
              <div class="w3a-spinner-power">
                <loaderSvg/>
              </div>
          </div>
          <button class="w3a-header__button w3ajs-loader-close-btn">
              <img src="${closeIcon}" alt="">
          </button>
        </div>
    </div>

</template>

<script lang="ts">
import Vue from "vue";
import loader from "../assets/torus-power.svg"

export default Vue.extend({
  name: "Loader",
  props: {
    isLoading: {
        type: Boolean,
        default:  false
    }
  },
  data() {
    return {
     
    };
  },
  components: {
    loaderSvg: loader,

  },

});
</script>
