<template>
  <div id="app">
    <h3>Using {{ exampleMode === 'beginner' ? `Basic Example` : 'Advance Example' }} </h3>
    <section
      :style="{
        fontSize: '12px',
      }"
    >
      <button @click="switchExampleMode" style="cursor: pointer;">Switch Example Mode</button>
    </section>
    <section>
      <AdvanceExampleMode v-if="exampleMode === 'advance'"></AdvanceExampleMode>
      <BeginnerExampleMode v-if="exampleMode === 'beginner'"></BeginnerExampleMode>
    </section>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import AdvanceExampleMode from "./AdvanceExample.vue"
import BeginnerExampleMode from "./BeginnerExample.vue"

import loader from "./assets/torus-power.svg"

export default Vue.extend({
  name: "app",
  data() {
    return {
      exampleMode: "beginner"
    };
  },
  components: {
    loaderSvg: loader,
    AdvanceExampleMode: AdvanceExampleMode,
    BeginnerExampleMode: BeginnerExampleMode
},
  mounted() {
    this.exampleMode = localStorage.getItem("exampleMode")
    if (!this.exampleMode) this.exampleMode = "beginner";
  },
  methods: {
    async switchExampleMode() {
      if (this.exampleMode === 'advance') {
        this.exampleMode = "beginner"
        localStorage.setItem("exampleMode", "beginner")
      } else {
        this.exampleMode = "advance"
        localStorage.setItem("exampleMode", "advance")
      }
    },
  },
  
  
});
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
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
button {
  height: 25px;
  margin: 5px;
  background: none;
  border-radius: 5px;
}
/* Modal */
#w3a-modal {
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

#w3a-modal .w3a-modal__loader {
    background: var(--bg1);
    position: absolute;
    display: flex;
    justify-content: center;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
}
#w3a-modal .w3a-modal__loader-content {
    text-align: center;
    margin-bottom: 80px;
    position: relative;
    display: flex;
    flex-direction: column;
}

.w3a-modal__loader-info {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 0 30px;
}

#w3a-modal .w3a-spinner-label {
    margin-top: 10px;
    font-size: 16px;
    font-weight: 500;
    color: #0364ff;
}

#w3a-modal .w3a-spinner-message {
    margin-top: 10px;
    font-size: 16px;
}
#w3a-modal .w3a-spinner-message:first-letter {
    text-transform: capitalize;
}
#w3a-modal .w3a-spinner-message.w3a-spinner-message--error {
    color: #fb4a61;
}

</style>
