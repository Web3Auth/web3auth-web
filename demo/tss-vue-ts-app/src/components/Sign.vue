<template>
  <div class="px-6">
    <v-row>
      <v-col cols="4">
        <span class="tag font-weight-black">DKLS19</span>
      </v-col>
      <v-col cols="12" md="8" class="text-right">
        <div >30/100%</div>
        <div>ga_array processing...</div>
      </v-col>
    </v-row>
    <div class="font-weight-bold mt-8 mb-1">Precomputing based on the following region:</div>
    <v-row>
      <v-col cols="12">
        <v-select :disabled="signing" class="rounded-lg" dense outlined v-model="region" :items="regions" item-text="name" item-value="key" />
      </v-col>
    </v-row>

    <div class="font-weight-bold mb-1">Message:</div>
    <v-form ref="form" v-model="validForm" @submit.prevent="">
      <v-row class="mb-8">
          <v-col cols="12" sm="8">
            <v-text-field :disabled="signing" class="rounded-lg" dense outlined :rules="[rules.required]" :value="message" />
          </v-col>
          <v-col cols="12" sm="4">
            <v-btn block large depressed color="primary" class="rounded-lg" :disabled="!validForm || signing" :loading="signing" @click="signMessage">Sign Message</v-btn>
          </v-col>
      </v-row>
    </v-form>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'SignScreen',
  props: {
    setStep: {
      type: Function
    }
  },
  data: () => ({
    region: { name: 'South America', key: 'sa' },
    regions: [
      { name: 'Singapore', key: 'sg' },
      { name: 'North America', key: 'na' },
      { name: 'South America', key: 'sa' },
      { name: 'Europe', key: 'eu' }
    ],
    message: 'Hello Bogota',
    signing: false,
    rules: {
      required: (value: string) => !!value || 'Required.'
    },
    validForm: true
  }),
  methods: {
    signMessage () {
      this.signing = true

      // TODO
      alert(this.message)

      this.signing = false
      this.setStep(3)
    }
  }
})
</script>
<style>
  .tag {
    background: #F0F0F0;
    border-radius: 10px;
    padding: 10px;
  }
</style>
