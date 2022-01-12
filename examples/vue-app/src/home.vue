<template>
  <div class="container">
    <div class="sidebar">
      <h2>Configuration</h2>
      <div class="flex chain">
        <label class="flex-20 fw-500" for="chain">Chain</label>
        <select class="flex-60 dropdown" name="chain" id="chain" v-model="form.chain">
          <option value="ethereum">Ethereum</option>
          <option value="binance">Binance</option>
          <option value="polygon">matic</option>
          <option value="solana">Solana</option>
        </select>
      </div>

      <div class="ui-mode">
        <div class="flex ui-mode">
          <span class="flex-20 fw-500">UI Mode</span>
          <span class="flex-60">
            <input type="radio" id="default" value="default" v-model="form.selectedUiMode" />
            <label for="default" class="mr-10">Default</label>
            <input type="radio" id="modal" value="modal" v-model="form.selectedUiMode" />
            <label for="modal" class="mr-10">CustomModal</label>
            <input type="radio" id="whitelabel" value="whitelabel" v-model="form.selectedUiMode" />
            <label for="whitelabel">WhiteLabel</label>
          </span>
        </div>
        <br />

        <!-- UI MODE DEFAULT -->
        <div v-if="form.selectedUiMode == 'default'">
          <div class="flex">
            <span class="flex-20 fw-500">Login</span>
            <div class="flex-60">
              <li v-for="loginType in form.uiMode.default.login" :key="loginType.id" class="list-style-none">
                <label :for="loginType.id">
                  <input type="checkbox" v-model="loginType.checked" v-bind:id="loginType.id" />
                  <span>{{ loginType.name }}</span>
                </label>
              </li>
            </div>
          </div>
          <br />
          <div class="flex">
            <span class="flex-20 fw-500">Wallet</span>
            <div class="flex-60">
              <li v-for="walletType in form.uiMode.default.wallet" :key="walletType.id" class="list-style-none">
                <label :for="walletType.id">
                  <input type="checkbox" v-model="walletType.checked" v-bind:id="walletType.id" />
                  <span>{{ walletType.name }}</span>
                </label>
              </li>
            </div>
          </div>
        </div>

        <!-- UI MODE YOUR OWN MODAL -->
        <div v-if="form.selectedUiMode == 'modal'">
          <div class="flex">
            <span class="flex-20 fw-500">Type</span>
            <span class="flex-60">
              <input type="radio" id="openlogin" name="openlogin" value="openlogin" v-model="form.uiMode.modal.customUi" />
              <label for="openlogin">OpenLogin</label>
              <br />
              <input type="radio" id="customauth" name="customauth" value="customauth" v-model="form.uiMode.modal.customUi" />
              <label for="customauth">CustomAuth</label>
              <br />
            </span>
          </div>
          <br />
        </div>

        <!-- UI MODE WHITELABEL -->
        <div v-if="form.selectedUiMode == 'whitelabel'">
          <div class="flex">
            <span class="flex-20 fw-500">Logo URL</span>
            <span class="flex-60">
              <input type="text" class="text" v-model="form.uiMode.whitelabel.logoUrl" />
            </span>
          </div>
          <br />
          <div class="flex">
            <span class="flex-20 fw-500">theme</span>
            <span class="flex-60">
              <input type="radio" id="light" name="light" value="light" v-model="form.uiMode.whitelabel.theme" />
              <label for="light">Light</label>
              <br />
              <input type="radio" id="dark" name="dark" value="dark" v-model="form.uiMode.whitelabel.theme" />
              <label for="dark">Dark</label>
              <br />
            </span>
          </div>
        </div>
      </div>
      <div class="flex">
        <span class="flex-20" />
        <button class="btn flex-60" @click="saveConfig">Submit</button>
      </div>
    </div>
    <div class="content">
      <h2>DEMO: {{ config.chain }} x {{ config.selectedUiMode }}</h2>
      <ethereum v-if="config.chain == 'ethereum'" />
      <binance v-if="config.chain == 'binance'" />
      <polygon v-if="config.chain == 'polygon'" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import binance from "./chains/binance.vue";
import ethereum from "./chains/ethereum.vue";
import matic from "./chains/matic.vue";

export default Vue.extend({
  name: "home",
  data() {
    return {
      form: {},
      config: {},
    };
  },
  components: {
    ethereum: ethereum,
    binance: binance,
    matic: matic,
  },
  mounted() {
    let defaultConfig = {
      chain: "ethereum",
      selectedUiMode: "default",
      uiMode: {
        default: {
          login: [
            {
              id: "google",
              name: "Google",
              checked: false,
            },
            {
              id: "facebook",
              name: "Facebook",
              checked: false,
            },
          ],
          wallet: [
            {
              id: "ethereum",
              name: "Ethereum Wallet",
              checked: false,
            },
            {
              id: "solana",
              name: "Solana Wallet",
              checked: false,
            },
          ],
        },
        modal: {
          customUi: undefined,
        },
        whitelabel: {
          logoUrl: "",
          theme: "light",
        },
      },
    };
    const storedConfig = localStorage.getItem("config");
    var config;
    try {
      config = JSON.parse(storedConfig);
    } catch (error) {}
    this.form = config || defaultConfig;
  },
  methods: {
    saveConfig: function () {
      localStorage.setItem("config", JSON.stringify(this.form));
      this.config = this.form;
    },
  },
});
</script>

<style>
body {
  margin: 0;
}

.container {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 30%;
  border-right: 1px solid #ebecf0;
  background-color: #f4f5f7;
  height: 100%;
}

.content {
  width: 70%;
}

.flex {
  display: flex;
}

.flex-20 {
  flex-basis: 20%;
  text-align: right;
  margin-right: 20px;
}
.flex-60 {
  flex-basis: 60%;
  text-align: left;
}
.dropdown {
  width: 100%;
  font-size: 16px;
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  box-sizing: border-box;
}

.mr-10 {
  margin-right: 10px;
}
.fw-500 {
  font-weight: 500;
}
.btn {
  padding: 9px 16px;
  max-height: 40px;
  border: 1px solid #d3d9df;
  background-color: #dae0e5b6;
  border-radius: 6px;
  font-size: 16px;
  text-align: center;
  font-weight: 500;
  cursor: pointer;
  min-width: 60%;
  margin-top: 50px;
  height: 40px;
  color: #fff;
  background-color: #007bff;
  border-color: #007bff;
}

.btn:hover {
  background-color: #0062cc;
  border-color: #005cbf;
}

.btn:focus {
  box-shadow: 0 0 0 0.2rem rgb(0 123 255 / 50%);
}

.ui-mode {
  padding: 20px 0;
}

.chain {
  padding: 20px 0;
}

.text {
  width: 100%;
  font-size: 16px;
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  box-sizing: border-box;
}

.list-style-none {
  list-style: none;
}
</style>
