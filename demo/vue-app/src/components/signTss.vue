<template>
  <div>
    <!-- TSS SIGN SCREEN -->
    <div v-if="!signature">
      <div class="text-h5 mb-10">TSS Message Signing</div>
      <v-row cols="12">
        <v-col cols="3" md="5" class="justify-end d-flex align-center font-weight-bold">
          <v-label>Region</v-label>
        </v-col>
        <v-col cols="6" md="2" class="d-flex align-center">
          <v-select id="region" v-model="region" :items="regions" item-text="name" item-value="key" append-icon="⌄" />
        </v-col>
      </v-row>
      <v-row cols="12">
        <v-col cols="3" md="5" class="justify-end d-flex align-center font-weight-bold">
          <v-label for="message">Message</v-label>
        </v-col>
        <v-col cols="8" md="4" class="d-flex align-center">
          <v-text-field id="message" v-model="message" placeholder="Hello DevCon" />
        </v-col>
      </v-row>
      <v-row class="mt-10">
        <v-col cols="8" sm="5" class="text-right">
          <v-progress-circular :rotate="-90" :size="120" :width="20" :value="progress" color="deep-orange">
            {{ progress }}
          </v-progress-circular>
        </v-col>
        <v-col cols="12" md="7" class="text-left pl-5 logs">
          <li>exchanging seeds 15%</li>
          <li>ga1_array processing 30%</li>
          <li>challenge + commitment 40%</li>
          <li>sampled seeds + deltas 65%</li>
          <li>verify commitments and unpad 100%</li>
        </v-col>
      </v-row>
      <v-row class="mt-5 mb-5 mt-10">
        <v-col cols="3" sm="5"></v-col>
        <v-col cols="auto" sm="5" class="text-left">
          <v-btn depressed color="primary" @click="sign" :loading="signing" :disabled="signing" style="cursor: pointer">Sign Message</v-btn>
        </v-col>
      </v-row>
    </div>

    <!-- VERIFY SCREEN -->
    <div v-if="signature">
      <div class="text-h5 mb-10">Verify Signature</div>
      <v-row>
        <v-col cols="3" md="5" class="justify-end d-flex align-center font-weight-bold">
          <v-label>Hash:</v-label>
        </v-col>
        <v-col cols="6" md="3" class="d-flex align-center">
          <v-text-field disabled id="hash" v-model="hash" />
        </v-col>
        <v-col cols="2" class="d-flex align-center">
          <CopyToClipboard :text="hash" />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="3" md="5" class="justify-end d-flex align-center font-weight-bold">
          <v-label>Signature:</v-label>
        </v-col>
        <v-col cols="6" md="3" class="d-flex align-center">
          <v-text-field disabled id="signature" v-model="signature" />
        </v-col>
        <v-col cols="2" class="d-flex align-center">
          <CopyToClipboard :text="signature" />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="3" md="5" class="justify-end d-flex align-center font-weight-bold">
          <v-label>Signer:</v-label>
        </v-col>
        <v-col cols="6" md="3" class="d-flex align-center">
          <v-text-field disabled id="signature" v-model="signer" />
        </v-col>
        <v-col cols="2" class="d-flex align-center">
          <CopyToClipboard :text="signer" />
        </v-col>
      </v-row>

      <v-row class="mt-5 mb-16">
        <v-col cols="3" sm="5"></v-col>
        <v-col cols="6" sm="5" class="text-left">
          <v-btn
            link
            depressed
            color="primary"
            target="_blank"
            href="https://etherscan.io/address/0x71d91a8988D81617be53427126ee62471321b7DF#readContract#F1"
            style="cursor: pointer"
          >
            Verify Signature
          </v-btn>
        </v-col>
      </v-row>

      <hr />
      <v-row class="mt-5 mb-5">
        <v-col cols="6" class="text-right">
          <v-btn small text @click="reset" color="primary" style="cursor: pointer">{{ "< Back to signing" }}</v-btn>
        </v-col>
        <v-col cols="6" class="text-left">
          <v-btn small text target="_blank" color="primary" href="https://mpc-compare.web3auth.io/">Benchmark site ></v-btn>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import CopyToClipboard from "@/components/copyToClipboard.vue";

export default Vue.extend({
  name: "SignTSS",
  props: {
    text: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      message: "",
      hash: "",
      signature: "",
      signer: "",
      signing: false,
      progress: 60,
      region: { name: "Singapore", key: "sg" },
      regions: [
        { name: "Singapore", key: "sg" },
        { name: "North America", key: "na" },
        { name: "South America", key: "sa" },
        { name: "Europe", key: "eu" },
      ],
    };
  },
  components: {
    CopyToClipboard,
  },
  methods: {
    async sign() {
      try {
        this.signing = true;
        alert("signing message");

        this.progress = 100;
        this.signature = "signature";
        this.hash = "hash";
        this.signer = "signer";
      } catch (error) {
        console.error(error);
        this.console("error", error);
      } finally {
        this.signing = false;
      }
    },
    async reset() {
      try {
        this.signature = "";
        this.hash = "";
        this.signer = "";
      } catch (error) {
        console.error(error);
        this.console("error", error);
      }
    },
  },
});
</script>

<style>
.col {
  padding-bottom: 0 !important;
  padding-top: 0 !important;
}
.logs {
  height: 300px;
  max-height: 300px;
  overflow: auto;
}
.v-text-field {
  padding-top: 0;
}
</style>
