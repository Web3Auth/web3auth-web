<template>
  <div class="px-5">
    <v-btn class="mb-2 px-0" link depressed plain color="primary" @click="goBack">{{"< Back"}}</v-btn>
    <div>
      <span class="tag font-weight-black">DKLS19</span>
    </div>
    <div class="mt-5 font-weight-medium">
      Copy and paste the fields to verify them on
      <a target="_blank" href="https://etherscan.io/address/0x71d91a8988D81617be53427126ee62471321b7DF#readContract#F1">Etherscan</a>
    </div>

    <div class="font-weight-bold mt-4 mb-1">Hash:</div>
    <v-row>
      <v-col cols="12">
        <TextFieldCopier :text="hash" />
      </v-col>
    </v-row>

    <div class="font-weight-bold mb-1">Signature:</div>
    <v-row>
      <v-col cols="12">
        <TextFieldCopier :text="signature" />
      </v-col>
    </v-row>

    <div class="font-weight-bold mb-1">Signer:</div>
    <v-row>
      <v-col cols="12">
        <TextFieldCopier :text="signer" />
      </v-col>
    </v-row>

    <v-row class="mb-8">
      <v-col cols="12" sm="6">
        <v-btn block large depressed color="primary" rounded :disabled="verified" @click="confirmVerification">I have verified it</v-btn>
      </v-col>
      <v-col cols="12" sm="6" class="text-center">
        <v-btn target="_blank" rounded link depressed plain color="primary" href="https://mpc-compare.web3auth.io/">Visit Benchmarking Site</v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

import TextFieldCopier from './TextFieldCopier.vue'

export default Vue.extend({
  name: 'VerifyScreen',
  props: {
    setStep: {
      type: Function
    }
  },
  components: {
    TextFieldCopier
  },
  data: () => ({
    copied: false,
    hash: 'sample-hash',
    signature: 'sample-signature',
    signer: 'sample-signer',
    verified: false
  }),
  methods: {
    goBack () {
      this.setStep(2)
      this.verified = false
    },
    copyToClipboard () {
      this.copied = true
      setTimeout(() => {
        this.copied = false
      }, 3000)
    },
    confirmVerification () {
      this.verified = true
      this.setStep(4)
    }
  }
})
</script>
<style>
  .tag {
    background: #F0F0F0;
    border-radius: 10px;
    padding: 10px;
    display: inline-block;
  }
</style>
