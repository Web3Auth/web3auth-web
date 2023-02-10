<template>
  <div>
    <h1>Set up 2FA</h1>
    <div v-if="!settingMfa">
      <span>MFA is not enabled</span>
      <button class="btn" style="margin-left: 10px" @click="selectEnableMfa">Enable MFA</button>
    </div>
    <div v-else>
      <h3 class="label">Set up using current browser</h3>
      <div>
        Use the current browser to approve access from new devices/browsers.
        <button v-if="!deviceShareAdded" class="btn" style="margin-left: 10px" @click="addDeviceShare">Add device share</button>
        <div v-else><strong>Device share added</strong></div>
      </div>

      <h3 class="label">Save recovery phrase</h3>
      <div>
        In case you lose access to your saved browser, you can authenticate with your recovery phrase.
        <button v-if="!recoveryShareAdded" class="btn" style="margin-left: 10px" @click="addRecoveryShare">Add recovery share</button>
        <div v-else>
          <strong>Recovery share added</strong>
          <button class="btn" style="margin-left: 10px" @click="exportShare">Show</button>
        </div>
      </div>

      <div style="margin-top: 20px">
        <button class="btn" @click="submitMfa">Submit MFA</button>
        <button class="btn" style="margin-left: 10px" @click="skipEnableMfa">Skip</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import web3auth from "@/web3auth";

export default defineComponent({
  name: "SetupMFA",
  props: {},
  data() {
    return {
      settingMfa: false,
      deviceShareAdded: false,
      recoveryShareAdded: false,
    };
  },
  computed: {},
  components: {},
  methods: {
    selectEnableMfa() {
      this.settingMfa = true;
    },
    skipEnableMfa() {
      this.settingMfa = false;
      this.deviceShareAdded = false;
      this.recoveryShareAdded = false;
    },
    addDeviceShare() {
      this.deviceShareAdded = true;
      alert("added device share");
    },
    addRecoveryShare() {
      this.recoveryShareAdded = true;
      alert("added recovery share");
    },
    async exportShare(shareIndex) {
      const serializedShare = await web3auth.exportShare(shareIndex);
      alert(serializedShare);
    },
    submitMfa() {
      alert("enabled MFA");
      // TODO: commit changes
    },
  },
});
</script>

<style></style>
