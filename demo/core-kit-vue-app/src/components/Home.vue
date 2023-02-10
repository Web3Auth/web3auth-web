<template>
  <div class="wrapper">
    <h1 class="title">CoreKit Demo</h1>
    <div v-if="!postboxKey" style="text-align: center">
      <!-- LOGIN -->
      <button class="lg-btn" @click="login">Log in</button>
    </div>
    <div v-else>
      <div class="row">
        <div class="account">
          <h3 class="label">Account:</h3>
          <div>{{ userInfo.name || userInfo.email || userInfo.verifierId }}</div>
        </div>
        <div class="logout">
          <button class="lg-btn" @click="logout">Log out</button>
        </div>
      </div>
      <div>
        <h3 class="label">Security factors: {{ threshold }}</h3>
        <div>The number of factors to authenticate in order to access your account.</div>
      </div>

      <!-- SETUP MFA -->
      <SetupMFA v-if="!mfaEnabled" style="margin-top: 20px"></SetupMFA>

      <!-- INPUT 2ND FACTOR -->
      <InputShare v-else-if="!tKeyWriteMode"></InputShare>

      <!-- MANAGE SHARES -->
      <ManageShares v-else class="mfa-container"></ManageShares>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapMutations, mapState } from "vuex";

import web3auth from "@/web3auth";

import InputShare from "./InputShare.vue";
import ManageShares from "./ManageShares.vue";
import SetupMFA from "./SetupMFA.vue";

export default defineComponent({
  name: "HomePage",
  data() {
    return {
      mfaEnabled: false,
    };
  },
  computed: {
    ...mapState(["postboxKey", "userInfo", "sharesInfo"]),
    threshold() {
      return this.sharesInfo.threshold ?? "1/1";
    },
    tKeyWriteMode() {
      return this.sharesInfo.tKeyWriteMode || false;
    },
  },
  components: { SetupMFA, InputShare, ManageShares },
  async created() {
    web3auth.init();
    if (this.postboxKey) {
      const tKeyExists = await web3auth.checkIfTKeyExists(this.postboxKey);
      this.mfaEnabled = tKeyExists;
      if (tKeyExists) {
        console.log("rehydrating");
        await web3auth.initTKey({ postboxKey: this.postboxKey });
        this.parseShares();
      }
    }
  },
  methods: {
    ...mapMutations(["setPostboxKey", "setUserInfo", "setSharesInfo"]),
    async login() {
      alert("login");
      if (!web3auth) return;
      await web3auth.connect({
        // subVerifierDetails: {
        //   typeOfLogin: "google",
        //   verifier: "google-lrc",
        //   clientId: "221898609709-obfn3p63741l5333093430j3qeiinaa8.apps.googleusercontent.com",
        // },
        aggregateVerifierType: "single_id_verifier",
        aggregateVerifierIdentifier: "tkey-google-lrc",
        subVerifierDetailsArray: [
          {
            typeOfLogin: "google",
            verifier: "torus",
            clientId: "221898609709-obfn3p63741l5333093430j3qeiinaa8.apps.googleusercontent.com",
          },
        ],
      });
      this.setUserInfo(web3auth.userInfo);
      this.setPostboxKey(web3auth.postboxKey);
      this.mfaEnabled = web3auth.tKey !== null;
      if (this.mfaEnabled) {
        this.parseShares();
      }
    },
    logout() {
      alert("logout");
      this.setPostboxKey("");
      this.setUserInfo({});
      this.setSharesInfo({});
    },
    parseShares() {
      const sharesInfo = web3auth.parseSharesInfo();
      this.setSharesInfo(sharesInfo);
    },
  },
});
</script>

<style>
.wrapper {
  padding: 20px;
}
.title {
  text-align: center;
}
.label {
  margin-bottom: 5px;
}
.btn {
  padding: 5px 10px;
}
.lg-btn {
  padding: 10px 50px;
}
.text-field {
  padding: 5px 20px;
}
.row {
  display: flex;
}
.account {
  flex-grow: 1;
}
.logout {
  flex-grow: 0;
}
</style>
