<template>
  <v-form ref="form" v-model="validForm" @submit.prevent="">
    <v-card class="mx-auto pt-10 sign-in" max-width="600" outlined shaped>
      <v-list-item-content class="px-8">
        <!-- HEADER -->
        <v-list-item-title class="text-h5 mb-2 font-weight-black">Sign in</v-list-item-title>
        <v-list-item-subtitle class="text-subtitle-1 font-weight-bold mb-10">Your blockchain account in one-click
        </v-list-item-subtitle>

        <!-- BODY -->
        <v-text-field label="Username" dense outlined rounded :rules="[rules.required]"></v-text-field>
        <v-text-field label="Password" type="password" dense outlined rounded :rules="[rules.required]"></v-text-field>
        <v-btn rounded color="primary" class="mt-5" large :disabled="!validForm || submitting" :loading="submitting" @click="signIn">Login</v-btn>
      </v-list-item-content>

      <!-- FOOTER -->
      <div class="footer text-center text-caption font-weight-regular pa-5 mt-5">
        <div>Self-custodial login by Web3Auth</div>
        <div>Terms of Service | Privacy Policy | Version 1.27.3</div>
      </div>
    </v-card>
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'LoginScreen',
  props: {
    setStep: {
      type: Function
    }
  },
  data: () => ({
    validForm: true,
    rules: {
      required: (value: string) => !!value || 'Required.'
    },
    submitting: false
  }),
  methods: {
    signIn () {
      this.submitting = true

      // TODO
      alert('Signing in')

      this.submitting = false
      this.setStep(2)
    }
  }
})
</script>

<style>
.sign-in {
  border: 1px solid #F3F4F6 !important;
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.08) !important;
  border-radius: 30px !important;
}

.footer {
  background: #F9FAFB;
  color: #9CA3AF;
}
</style>
