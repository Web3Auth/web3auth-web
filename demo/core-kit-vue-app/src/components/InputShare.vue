<template>
  <div>
    <h1>Input 2nd Factor</h1>
    <h3 class="label">Account Password:</h3>
    <input class="text-field" placeholder="account password" v-model="accountPassword" />
    <button class="btn" @click="inputPassword" style="margin-left: 10px">Input</button>

    <h3 class="label">Recovery Password:</h3>
    <input class="text-field" style="margin-right: 5px" placeholder="enter backup mnemonic" v-model="backupMnemonic" />
    <button class="btn" @click="inputRecoveryShare" style="margin-left: 10px">Input</button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapMutations } from "vuex";

import web3auth from "@/web3auth";

export default defineComponent({
  name: "InputPassword",
  props: {
    deviceList: {
      type: Array,
      required: false,
    },
  },
  data() {
    return {
      accountPassword: "",
      backupMnemonic: "",
    };
  },
  computed: {},
  components: {},
  methods: {
    ...mapMutations(["setSharesInfo"]),
    async inputPassword() {
      await web3auth.inputPassword(this.accountPassword);
      await web3auth.generateAndStoreNewDeviceShare();
      await web3auth.commitChanges();
      alert("password inputted");
      this.parseSharesInfo();
      this.accountPassword = "";
    },
    async inputRecoveryShare() {
      await web3auth.inputBackupShare(this.backupMnemonic);
      await web3auth.generateAndStoreNewDeviceShare();
      await web3auth.commitChanges();
      alert("recover share inputted");
      this.parseSharesInfo();
      this.backupMnemonic = "";
    },
    parseSharesInfo() {
      const sharesInfo = web3auth.parseSharesInfo();
      this.setSharesInfo(sharesInfo);
    },
  },
});
</script>

<style></style>
