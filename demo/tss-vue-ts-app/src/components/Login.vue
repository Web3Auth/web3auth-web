<template>
  <v-form ref="form" v-model="validForm" @submit.prevent="">
    <v-card class="mx-auto pt-10 sign-in" max-width="600" outlined shaped>
      <v-list-item-content class="px-8">
        <!-- HEADER -->
        <v-list-item-title class="text-h5 mb-2 font-weight-black">Sign in</v-list-item-title>
        <v-list-item-subtitle class="text-subtitle-1 font-weight-bold mb-10">Your blockchain account in one-click</v-list-item-subtitle>

        <!-- BODY -->
        <v-row class="px-3">
          <v-btn block rounded color="primary" class="mt-5" large :disabled="!validForm || submitting" :loading="submitting" @click="connectTo">
            Login
          </v-btn>
        </v-row>
      </v-list-item-content>

      <!-- FOOTER -->
      <div class="footer text-center text-caption font-weight-regular pa-8 mt-12">
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
