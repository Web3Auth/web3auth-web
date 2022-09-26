<template>
  <div>
    <!-- TSS SIGN SCREEN -->
    <div v-if="!signature">
      <h2>TSS Message Signing</h2>

      <div class="form-row">
        <label class="form-label" for="message">Region</label>
        <select id="message" class="form-input" v-model="region">
          <option value="sg">Singapore</option>
          <option value="na">North America</option>
          <option value="sa">South America</option>
          <option value="eu">Europe</option>
        </select>
      </div>

      <div class="form-row">
        <label class="form-label" for="message">Message</label>
        <input id="message" class="form-input" v-model="message" placeholder="Hello DevCon" />
      </div>

      <div class="form-row">
        <div id="console" class="form-input" style="white-space: pre-line">
          <p style="white-space: pre-line"></p>
          <li>exchanging seeds 15%</li>
          <li>ga1_array processing 30%</li>
          <li>challenge + commitment 40%</li>
          <li>sampled seeds + deltas 65%</li>
          <li>verify commitments and unpad 100%</li>
        </div>
      </div>

      <button @click="sign" style="cursor: pointer">Sign</button>
    </div>

    <!-- VERIFY SCREEN -->
    <div v-if="signature">
      <h2>Verify</h2>

      <div class="form-row">
        <label class="form-label" for="hash">Hash:</label>
        <input disabled id="hash" class="form-input" v-model="hash" placeholder="" />
        <CopyToClipboard :text="hash" />
      </div>

      <div class="form-row">
        <label class="form-label" for="signature">Signature:</label>
        <input disabled id="signature" class="form-input" v-model="signature" placeholder="" />
        <CopyToClipboard :text="signature" />
      </div>

      <div class="form-row">
        <label class="form-label" for="signer">Signer:</label>
        <input disabled id="signer" class="form-input" v-model="signer" placeholder="" />
        <CopyToClipboard :text="signer" />
      </div>

      <div class="form-row">
        <label class="form-label"></label>
        <a target="_blank" href="https://etherscan.io/verifyContract">Verify Signature</a>
      </div>

      <div id="console" style="white-space: pre-line">
        <p style="white-space: pre-line"></p>
      </div>
      <div class="form-row">
        <label class="form-label"></label>
        <a class="rpcBtn" target="_blank" href="https://mpc-compare.web3auth.io/">Benchmark site</a>
      </div>
      <div class="form-row">
        <label class="form-label"></label>
        <button class="rpcBtn" @click="reset" style="cursor: pointer">Back to signing</button>
      </div>
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
      region: "sg",
      message: "",
      hash: "",
      signature: "",
      signer: "",
    };
  },
  components: {
    CopyToClipboard,
  },
  methods: {
    async sign() {
      try {
        alert("signing message");
        this.signature = "signature";
        this.hash = "hash";
        this.signer = "signer";
      } catch (error) {
        console.error(error);
        this.console("error", error);
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
.form-row {
  display: flex;
  margin-bottom: 0.5rem;
  width: 100%;
}
.form-label {
  flex-basis: 30%;
  padding-right: 10px;
  display: flex;
  align-items: center;
  justify-content: right;
  font-weight: bold;
  font-size: 1rem;
}
.form-input {
  flex-basis: 30%;
  text-align: left;
  padding: 0.3rem 0.8rem;
  font-size: 1rem;
  border-radius: 8px;
  border-width: 2px;
}
</style>
