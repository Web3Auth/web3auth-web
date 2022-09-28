<template>
  <v-app>
    <!-- HEADER -->
    <v-app-bar app>
      <div class="d-flex align-center ml-5">
        <v-img
          alt="Web3Auth logo"
          :src="require(`@/assets/web3auth.svg`)"
          height="30"
          transition="scale-transition"
          contain
        />
      </div>

      <v-spacer></v-spacer>
      <v-btn
        v-if="currentStep > 1"
        text
        color="#828282"
        @click="logout"
      >
        <v-icon>mdi-logout</v-icon>
        <span class="mr-2 text-capitalize">Logout</span>
      </v-btn>
    </v-app-bar>

    <!-- MAIN -->
    <v-main class="mt-10">
      <v-row justify="center">
        <v-col cols="12" md="4" class="pl-5" v-if="$vuetify.breakpoint.smAndDown">
          <div class="text-center">
            <div class="text-h3 mb-3 font-weight-bold">MPC Demo</div>
            <div class="text-h6 mb-2 font-weight-regular">Experience MPC in 3 simple steps</div>
          </div>
          <Stepper :current-step="currentStep" />
        </v-col>

        <v-col cols="12" md="4">
          <Login v-if="currentStep == 1" :set-step="setStep" />
          <Sign v-if="currentStep == 2" :set-step="setStep" />
          <Verify v-if="currentStep >= 3" :set-step="setStep" />
        </v-col>

        <v-col cols="12" md="4" class="pl-16" v-if="$vuetify.breakpoint.mdAndUp">
          <div>
            <div class="text-h3 mb-3 text-left font-weight-bold">MPC Demo</div>
            <div class="text-h6 text-left mb-10 font-weight-regular">Experience MPC in 3 simple steps</div>
          </div>
          <Stepper :current-step="currentStep" />
        </v-col>
      </v-row>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue'
import Login from './components/Login.vue'
import Verify from './components/Verify.vue'
import Sign from './components/Sign.vue'
import Stepper from './components/Stepper.vue'

export default Vue.extend({
  name: 'App',

  components: {
    Login,
    Verify,
    Sign,
    Stepper
  },

  data: () => ({
    currentStep: 1,
    loggedIn: false
  }),
  methods: {
    setStep (value: number) {
      this.currentStep = value
    },
    logout () {
      alert('Logout')
      this.setStep(1)
    }
  }
})
</script>
<style>
#app {
  background-image: url("@/assets/bg-1.svg"), url("@/assets/bg-2.svg");
  background-position: left -250px top -250px, right -40px bottom -170px;
  background-repeat: no-repeat, no-repeat;
}
</style>
