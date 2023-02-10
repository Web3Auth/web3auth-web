<template>
  <div>
    <h1>Security Settings</h1>
    <div>
      <h3 class="label">Social logins via Torus nodes:</h3>
      <div>{{ userInfo.typeOfLogin }} - {{ userInfo.verifierId }}</div>
    </div>

    <!-- DEVICE SHARES -->
    <div>
      <h3 class="label">Devices:</h3>
      <li v-for="device in deviceShares" :key="device.index" style="margin-top: 5px">
        <span>{{ device.title }} ({{ device.osDetails }}) - {{ device.dateAdded }}</span>
        <span style="margin-left: 10px">
          <button class="btn" @click="exportShare(device.index)">Export</button>
          <button class="btn" style="margin-left: 5px" @click="deleteShare(device.index)">Delete</button>
        </span>
      </li>
    </div>

    <!-- RECOVERY SHARES -->
    <div>
      <h3 class="label">Recovery Share:</h3>
      <li v-for="share in recoveryShares" :key="share.index">
        <span>{{ share.email }} {{ share.dateAdded }}</span>
        <span style="margin-left: 10px">
          <button class="btn" @click="exportShare(share.index)">Export</button>
          <button class="btn" style="margin-left: 5px" @click="deleteShare(share.index)">Delete</button>
        </span>
      </li>
      <div v-if="Object.keys(recoveryShares).length === 0">
        <button class="btn" @click="addRecoveryShare">{{ recoveryShares.length }} Add recovery share</button>
      </div>
    </div>

    <!-- PASSWORD SHARE -->
    <div>
      <h3 class="label">Account Password:</h3>
      <div v-if="!passwordAvailable">
        <input class="text-field" placeholder="set password" v-model="accountPassword" />
        <button class="btn" style="margin-left: 10px" @click="addPassword">Confirm</button>
      </div>
      <div v-else>
        <div v-if="!changePasswordMode">
          <span>Password was set</span>
          <button class="btn" @click="switchChangePassword" style="margin-left: 10px">Change password</button>
        </div>
        <div v-else>
          <input class="text-field" placeholder="set password" v-model="accountPassword" />
          <button class="btn" style="margin-left: 10px" @click="changePassword">Confirm change</button>
          <button class="btn" style="margin-left: 10px" @click="cancelChangePassword">Cancel</button>
        </div>
      </div>
    </div>

    <!-- SHARE TRANSFER -->
    <!-- <div>
      <h3 class="label">Transfer share:</h3>
      <input class="text-field" style="margin-right: 5px" placeholder="share request index" />
      <button class="btn" @click="exportShare">Approve share</button>
    </div> -->
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapMutations, mapState } from "vuex";

import web3auth from "@/web3auth";

export default defineComponent({
  name: "ManageShares",
  props: {},
  data() {
    return {
      accountPassword: "",
      changePasswordMode: false,
    };
  },
  computed: {
    ...mapState(["postboxKey", "userInfo", "sharesInfo"]),
    recoveryShares() {
      return this.sharesInfo.recoveryShares ?? {};
    },
    deviceShares() {
      return this.sharesInfo.deviceShares ?? [];
    },
    passwordAvailable() {
      return this.sharesInfo.passwordAvailable ?? false;
    },
  },
  components: {},
  methods: {
    ...mapMutations(["setSharesInfo"]),
    switchChangePassword() {
      this.changePasswordMode = true;
    },
    cancelChangePassword() {
      this.changePasswordMode = false;
      this.accountPassword = "";
    },
    async addPassword() {
      await web3auth.addPassword(this.accountPassword);
      await web3auth.commitChanges();
      alert("added password");
      this.parseSharesInfo();
      this.accountPassword = "";
    },
    async changePassword() {
      if (this.accountPassword.trim() === "") {
        alert("password can not be empty");
        return;
      }
      await web3auth.changePassword(this.accountPassword);
      await web3auth.commitChanges();
      alert("password changed");
      this.parseSharesInfo();
      this.changePasswordMode = false;
      this.accountPassword = "";
    },
    async exportShare(shareIndex) {
      if (!web3auth) return;
      const serializedShare = await web3auth.exportShare(shareIndex);
      alert(serializedShare);
    },
    async addRecoveryShare() {
      await web3auth.addRecoveryShare();
      await web3auth.commitChanges();
      alert("added recovery share");
      this.parseSharesInfo();
    },
    async deleteShare(shareIndex) {
      try {
        await web3auth.deleteShare(shareIndex);
      } catch (err) {
        console.log("error when deleting share");
      }
      await web3auth.commitChanges();
      this.parseSharesInfo();
      alert("deleted share");
    },
    parseSharesInfo() {
      const sharesInfo = web3auth.parseSharesInfo();
      this.setSharesInfo(sharesInfo);
    },
  },
});
</script>

<style></style>
