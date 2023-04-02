<template>
  <v-form ref="form" v-model="validForm" @submit.prevent="">
    <v-card class="pt-10 mx-auto sign-in" max-width="600" outlined shaped>
      <v-list-item-content class="px-8">
        <!-- HEADER -->
        <v-list-item-title class="mb-2 text-h5 font-weight-black">Sign in</v-list-item-title>
        <v-list-item-subtitle class="mb-10 text-subtitle-1 font-weight-bold">Your blockchain account in one-click</v-list-item-subtitle>

        <!-- BODY -->
        <v-row class="px-3">
          <v-btn block rounded color="primary" class="mt-5" large :disabled="!validForm || submitting" :loading="submitting" @click="connectTo">
            Login with google
          </v-btn>
        </v-row>
      </v-list-item-content>

      <!-- FOOTER -->
      <div class="mt-12 text-center footer text-caption font-weight-regular pa-8">
        <div>Self-custodial login by Web3Auth</div>
        <div>Terms of Service | Privacy Policy | Version 1.27.3</div>
      </div>
    </v-card>
  </v-form>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "LoginScreen",
  props: {
    setStep: {
      type: Function,
    },
    connect: {
      type: Function,
    },
  },
  data: () => ({
    validForm: true,
    rules: {
      required: (value: string) => !!value || "Required.",
    },
    submitting: false,
  }),
  methods: {
    async connectTo() {
      await this.connect();
    },
  },
});
</script>

<style>
.sign-in {
  border: 1px solid #f3f4f6 !important;
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.08) !important;
  border-radius: 30px !important;
}

.footer {
  background: #f9fafb;
  color: #9ca3af;
}
</style>
