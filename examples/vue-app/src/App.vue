<template>
  <div id="app">
    <Home />
    <!-- <DefaultModal /> -->
    <!-- <section>
      <ConfigurableExample :chain="chain" v-if="exampleMode === 'default'"></ConfigurableExample>
      <WhitelabelExample :theme="'dark'" v-else-if="exampleMode === 'whitelabel'"></WhitelabelExample>
      <CustomUiContainer :authType="authType" v-else-if="exampleMode === 'customUi'"></CustomUiContainer>
    </section> -->
  </div>
</template>

<script lang="ts">
import Vue from "vue";

// import DefaultModal from "./default/defaultModal.vue";
import Home from "./home.vue";

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
    // DefaultModal,
  },

  methods: {},
});
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#console {
  border: 0px solid black;
  height: 40px;
  padding: 2px;
  text-align: left;
  width: calc(100% - 20px);
  border-radius: 5px;
  margin-top: 20px;
  margin-bottom: 80px;
}
#console > p {
  margin: 0.5em;
}

/* Modal */
#w3a-example-modal {
  --bg1: #0f1222;
  --bg2: #24262e;
  --text-color1: #d3d3d4;
  --text-color2: #ffffff;

  --text-header: Poppins, Helvetica, sans-serif;
  --text-body: DM Sans, Helvetica, sans-serif;

  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 15px;
  background: rgba(33, 33, 33, 0.46);
  color: var(--text-color1);
  font-family: var(--text-body);
}

#w3a-example-modal .w3a-example-modal__loader {
  background: var(--bg1);
  position: absolute;
  display: flex;
  justify-content: center;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
#w3a-example-modal .w3a-example-modal__loader-content {
  text-align: center;
  margin-bottom: 80px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.w3a-example-modal__loader-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 30px;
}

#w3a-example-modal .w3a-spinner-label {
  margin-top: 10px;
  font-size: 16px;
  font-weight: 500;
  color: #0364ff;
}

#w3a-example-modal .w3a-spinner-message {
  margin-top: 10px;
  font-size: 16px;
}
#w3a-example-modal .w3a-spinner-message:first-letter {
  text-transform: capitalize;
}
#w3a-example-modal .w3a-spinner-message.w3a-spinner-message--error {
  color: #fb4a61;
}
</style>
