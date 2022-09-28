<template>
  <v-stepper vertical outlined :value="currentStep">
    <v-stepper-step step="1" :complete="currentStep > 1">
      <small class="mb-2 text-uppercase font-weight-bold">Step 1</small>
      <span class="font-weight-bold">Login</span>
    </v-stepper-step>
    <v-stepper-content step="1" :class="currentStep > 1 ? 'complete py-10 ' : 'py-10'"></v-stepper-content>

    <v-stepper-step step="2" :complete="currentStep > 2">
      <small class="mb-2 text-uppercase font-weight-bold">Step 2</small>
      <span class="font-weight-bold">Precompute and Sign</span>
    </v-stepper-step>
    <v-stepper-content step="2" :class="currentStep > 2 ? 'complete py-10 ' : 'py-10'"></v-stepper-content>

    <v-stepper-step step="3" :complete="currentStep > 3">
      <small class="mb-2 text-uppercase font-weight-bold">Step 3</small>
      <span class="font-weight-bold">Verify</span>
    </v-stepper-step>
    <v-stepper-content step="3" :class="currentStep > 3 ? 'complete py-10 ' : 'py-10'"></v-stepper-content>
  </v-stepper>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'StepperComponent',
  props: {
    currentStep: {
      type: Number
    }
  },
  components: {
  },
  data: () => ({
    copied: false,
    hash: 'sample-hash',
    signature: 'sample-signature',
    signer: 'sample-signer'
  }),
  methods: {
  }
})
</script>
<style>
  .v-sheet--outlined {
    border: none !important;
  }
  .v-stepper__step__step {
    height: 40px !important;
    width: 40px !important;
  }
  .v-application--is-ltr .v-stepper--vertical .v-stepper__content {
    margin: -8px -43px -16px 43px !important;
  }
  .v-application .v-stepper__step--complete .v-stepper__step__step.primary {
    background-color: #30CCA4 !important;
    border-color: #30CCA4 !important;
  }
  .v-application--is-ltr .theme--light.v-stepper--vertical .v-stepper__content.complete:not(:last-child) {
    border-left: 3px solid #30CCA4 !important;
  }
  .v-application .v-stepper__step__step.primary {
    background-color: #FFF !important;
    border: 2px solid hsl(210, 79%, 46%) !important;
    color: #1976d2;
    font-weight: bold;
  }
</style>
