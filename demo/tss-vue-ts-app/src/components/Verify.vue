<template>
  <div class="px-5">
    <v-btn class="mb-2 px-0" link depressed plain color="#0364FF" @click="goBack">{{ "< Back" }}</v-btn>
    <div>
      <span class="tag font-weight-black">DKLS19</span>
    </div>
    <div class="mt-5 font-weight-medium">
      Copy and paste the fields to verify them on
      <a style="color: #0364ff" target="_blank" href="https://etherscan.io/address/0x71d91a8988D81617be53427126ee62471321b7DF#readContract#F1">
        Etherscan
      </a>
    </div>

    <div class="font-weight-bold mt-4 mb-1">Hash:</div>
    <v-row>
      <v-col cols="12">
        <TextFieldCopier :text="finalHash" />
      </v-col>
    </v-row>

    <div class="font-weight-bold mb-1">Signature:</div>
    <v-row>
      <v-col cols="12">
        <TextFieldCopier :text="finalSig" />
      </v-col>
    </v-row>

    <div class="font-weight-bold mb-1">Signer:</div>
    <v-row>
      <v-col cols="12">
        <TextFieldCopier :text="finalSigner" />
      </v-col>
    </v-row>

    <v-row class="mb-8">
      <v-col cols="12" sm="6">
        <v-btn
          target="_blank"
          block
          large
          rounded
          link
          depressed
          color="primary"
          @click="confirmVerification"
          href="https://etherscan.io/address/0x71d91a8988D81617be53427126ee62471321b7DF#readContract#F1"
        >
          Verify on Etherscan
        </v-btn>
      </v-col>
      <v-col cols="12" sm="6" class="text-center">
        <v-btn target="_blank" block large rounded link plain color="#0364FF" href="https://mpc-compare.web3auth.io/">Visit Benchmarking Site</v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import TextFieldCopier from "./TextFieldCopier.vue";

export default Vue.extend({
  name: "VerifyScreen",
  props: {
    setStep: {
      type: Function,
    },
    finalHash: {
      type: String,
    },
    finalSig: {
      type: String,
    },
    finalSigner: {
      type: String,
    },
  },
  components: {
    TextFieldCopier,
  },
  data: () => ({
    copied: false,
    verified: false,
  }),
  methods: {
    goBack() {
      this.setStep(2);
      this.verified = false;
    },
    copyToClipboard() {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 3000);
    },
    confirmVerification() {
      this.verified = true;
      this.setStep(4);
    },
  },
});
</script>
<style>
.tag {
  background: #f0f0f0;
  border-radius: 10px;
  padding: 5px 16px;
  display: inline-block;
}
</style>
