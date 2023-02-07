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
        <h3 class="label">Security factors: {{ securityFactors }}</h3>
        <div>The number of factors to authenticate in order to access your account.</div>
      </div>
      <div v-if="!mfaEnabled" style="margin-top: 20px">
        <!-- SETUP MFA -->
        <h1>Set up 2FA</h1>
        <h3 class="label">Set up using current browser</h3>
        <div>Use the current browser to approve access from new devices/browsers.</div>

        <h3 class="label">Save recovery phrase</h3>
        <div>In case you lose access to your saved browser, you can authenticate with your recovery phrase.</div>

        <button class="btn" style="margin-top: 20px" @click="enableMfa">Enable MFA</button>
      </div>
      <div v-else-if="!tKeyWriteMode">
        <!-- INPUT BACKUP PHRASE -->
        <h1>Input Backup phrase</h1>
        <h3 class="label">Account Password:</h3>
        <input class="text-field" placeholder="account password" />

        <h3 class="label">Recovery Password:</h3>
        <input class="text-field" style="margin-right: 5px" placeholder="enter backup phrase" />
      </div>
      <div v-else class="mfa-container">
        <!-- MANAGE SHARES -->
        <h1>Security Settings</h1>
        <div>
          <h3 class="label">Social logins via Torus nodes:</h3>
          <div>{{ userInfo.typeOfLogin }} - {{ userInfo.verifierId }}</div>
        </div>
        <div>
          <h3 class="label">Devices:</h3>
          <li v-for="device in deviceList" :key="device.index">
            <span>{{ device.title }} ({{ device.osDetails }}) - {{ device.dateAdded }}</span>
            <span style="margin-left: 10px">
              <button class="btn" @click="exportShare(device.index)">Export</button>
              <button class="btn" style="margin-left: 5px" @click="deleteShare">Delete</button>
            </span>
          </li>
        </div>
        <div>
          <h3 class="label">Recovery Share:</h3>
          <li v-for="share in recoveryShares" :key="share.index">
            <span>{{ share.email }} {{ share.dateAdded }}</span>
            <span style="margin-left: 10px">
              <button class="btn" @click="exportShare(share.index)">Export</button>
              <button class="btn" style="margin-left: 5px" @click="deleteShare(share.index)">Delete</button>
            </span>
          </li>
          <div v-if="recoveryShares.length == 0">
            <input class="text-field" style="margin-right: 5px" placeholder="email to receive recovery share" />
            <button class="btn" @click="addRecoveryShare">Submit</button>
          </div>
        </div>
        <div>
          <h3 class="label">Account Password:</h3>
          <div><input class="text-field" placeholder="password" /></div>
          <div style="margin-top: 5px"><input class="text-field" placeholder="confirm password" /></div>
        </div>
        <!-- <div>
          <h3 class="label">Social Recovery:</h3>
          <input class="text-field" style="margin-right: 5px" placeholder="other social account" />
          <button class="btn" @click="exportShare">Download</button>
          <button class="btn" style="margin-left: 5px" @click="deleteShare">Delete</button>
        </div> -->
        <div>
          <button class="lg-btn" style="margin-top: 20px" @click="enableMfa">Commit changes</button>
        </div>

        <!-- SHARE TRANSFER -->
        <div>
          <h3 class="label">Transfer share:</h3>
          <input class="text-field" style="margin-right: 5px" placeholder="share request index" />
          <button class="btn" @click="exportShare">Approve share</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { SHARE_SERIALIZATION_MODULE_KEY, WEB_STORAGE_MODULE_KEY, Web3Auth } from "@web3auth/core-kit";
import bowser from "bowser";
import { defineComponent } from "vue";
import { mapMutations, mapState } from "vuex";

function formatDate(date: string | Date): string {
  if (!date) return "";
  const toFormat = date instanceof Date ? date : new Date(date);
  const day = toFormat.getDate().toString().padStart(2, "0");
  const month = (toFormat.getMonth() + 1).toString().padStart(2, "0");
  const year = toFormat.getFullYear().toString().substring(2);
  return `${day}/${month}/${year}, ${toFormat.toLocaleString(undefined, { timeStyle: "short", hour12: false })}`;
}

export default defineComponent({
  name: "HomePage",
  data() {
    return {
      web3auth: null as Web3Auth | null,
      mfaEnabled: false,
      securityFactors: "",
      tKeyWriteMode: false,
      deviceList: [],
      recoveryShare: [],
    };
  },
  computed: {
    ...mapState(["postboxKey", "userInfo"]),
  },
  async created() {
    this.web3auth = new Web3Auth({
      customAuthArgs: { baseUrl: `${location.origin}/serviceworker`, network: "testnet", uxMode: "popup" },
      manualSync: true,
    });
    if (this.postboxKey) {
      console.log("rehydrating");
      await this.web3auth.rehydrate({ postboxKey: this.postboxKey });
      this.parseKeyData();
    }
  },
  components: {},
  methods: {
    ...mapMutations(["setPostboxKey", "setUserInfo"]),
    async login() {
      alert("login");
      if (!this.web3auth) return;
      // const loginResponse = await this.web3auth.triggerLogin({
      //   typeOfLogin: "google",
      //   verifier: "torus",
      //   clientId: "221898609709-obfn3p63741l5333093430j3qeiinaa8.apps.googleusercontent.com",
      // });
      const loginResponse = await this.web3auth.triggerAggregateLogin({
        aggregateVerifierType: "single_id_verifier",
        verifierIdentifier: "tkey-google-lrc",
        subVerifierDetailsArray: [
          {
            typeOfLogin: "google",
            verifier: "torus",
            clientId: "221898609709-obfn3p63741l5333093430j3qeiinaa8.apps.googleusercontent.com",
          },
        ],
      });
      this.setUserInfo(loginResponse.userInfo[0]);
      this.setPostboxKey(loginResponse.privateKey);
      this.parseKeyData();
    },
    logout() {
      alert("logout");
      this.setPostboxKey("");
    },
    parseKeyData() {
      const { threshold, totalShares, requiredShares, shareDescriptions } = this.web3auth.getKeyDetails();
      if (threshold === 1) {
        this.securityFactors = "1 factor";
        this.mfaEnabled = false;
      } else {
        this.securityFactors = `${threshold}/${totalShares}`;
        this.mfaEnabled = true;
      }

      this.tKeyWriteMode = requiredShares <= 0;
      this.deviceList = this.parseDeviceList(shareDescriptions);
      this.recoveryShares = this.parseRecoveryShares(shareDescriptions);
    },
    enableMfa() {
      this.mfaEnabled = true;
    },
    async exportShare(shareIndex) {
      if (!this.web3auth) return;
      const serializedShare = await this.web3auth.exportShare(shareIndex);
      alert(serializedShare);
    },
    async addRecoveryShare() {
      alert("added recovery share");
    },
    async deleteShare(shareIndex) {
      try {
        await this.web3auth.deleteShare(shareIndex);
      } catch (err) {
        console.log("error when deleting share");
      }
      await this.web3auth.commitChanges(shareIndex);
      alert("deleted share");
      this.parseKeyData();
    },
    parseDeviceList(shareDescriptions: Array<any>) {
      // TODO: MOVE TO COREKIT SDK
      const deviceList = [];
      for (const shareIdx in shareDescriptions) {
        const shareInfo = JSON.parse(shareDescriptions[shareIdx]);
        if (shareInfo.module === WEB_STORAGE_MODULE_KEY) {
          const browserInfo = bowser.parse(shareInfo.userAgent);
          const browserName = `${browserInfo.browser.name}`;
          const title = `${browserName}V${browserInfo.browser.version}`;
          const osDetails = `${browserInfo.os.name || ""}, ${browserInfo.platform.type || ""}`.trim();
          const dateFormatted = formatDate(shareInfo.dateAdded);
          deviceList.push({
            index: shareIdx,
            userAgent: shareInfo.userAgent,
            title,
            osDetails,
            dateAdded: dateFormatted,
          });
        }
      }
      return deviceList;
    },
    parseRecoveryShares(shareDescriptions: Array<any>) {
      // TODO: MOVE TO COREKIT SDK
      const emailShares = [];
      for (const shareIdx in shareDescriptions) {
        const shareInfo = JSON.parse(shareDescriptions[shareIdx]);
        if (shareInfo.module === SHARE_SERIALIZATION_MODULE_KEY) {
          const dateFormatted = formatDate(shareInfo.date);
          emailShares.push({
            index: shareIdx,
            email: shareInfo.data,
            dateAdded: dateFormatted,
          });
        }
      }
      return emailShares;
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
