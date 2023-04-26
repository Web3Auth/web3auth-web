<template>
  <v-form ref="form" v-model="validForm" @submit.prevent="">
    <v-card class="pt-10 mx-auto sign-in" max-width="600" outlined shaped>
      <v-list-item-content class="px-8">
        <!-- HEADER -->
        <v-list-item-title class="mb-2 text-h5 font-weight-black">Sign in</v-list-item-title>
        <v-list-item-subtitle class="mb-10 text-subtitle-1 font-weight-bold">Your blockchain account in one-click</v-list-item-subtitle>

        <!-- BODY -->
        <v-row class="px-3">
          <v-btn block rounded color="primary" class="mt-5" large :disabled="submitting" :loading="submitting" @click="() => connectTo('google')">
            Login with google
          </v-btn>
        </v-row>

        <v-row class="pa-3">
          <v-divider></v-divider>
          <div class="px-2">
            <div class="or-text text3--text">OR</div>
          </div>
          <v-divider></v-divider>
        </v-row>

        <v-row>
          <v-text-field
            v-model="email"
            dense
            :rules="[rules.required, rules.email]"
            block
            outlined
            placeholder="Please enter your email address"
            class="pb-0 rounded-pill"
          ></v-text-field>
          <v-btn block rounded color="primary" large :disabled="!validForm || submitting" :loading="submitting" @click="connnectWithEmail">
            Login with email
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
import { LOGIN_PROVIDER } from "@toruslabs/base-controllers";
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
    submitting: { type: Boolean, default: false },
  },
  data: () => ({
    validForm: true,
    email: "",
    rules: {
      required: (value: string) => !!value || "Required.",
      email: (value: string): string | boolean =>
        /^(([^\s"(),.:;<>@[\\\]]+(\.[^\s"(),.:;<>@[\\\]]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([\dA-Za-z-]+\.)+[A-Za-z]{2,}))$/.test(value) ||
        "Invalid email",
    },
  }),
  methods: {
    async connectTo(loginProvider: string, loginHint?: string) {
      await this.connect(loginProvider, loginHint);
    },
    connnectWithEmail() {
      this.connectTo(LOGIN_PROVIDER.EMAIL_PASSWORDLESS, this.email);
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
