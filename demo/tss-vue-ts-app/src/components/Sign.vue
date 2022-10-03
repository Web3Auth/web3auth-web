<template>
  <div :class="$vuetify.breakpoint.mdAndUp ? 'mt-16 px-6' : 'px-6'">
    <div class="d-flex justify-space-between align-center mb-2">
      <div class="tag font-weight-black">DKLS19</div>
      <v-progress-linear :value="progressPercent" rounded color="success" class="ml-5" height="20">
        <template v-slot:default="{ value }">
          <strong>{{ Math.ceil(value) }}%</strong>
        </template>
      </v-progress-linear>
    </div>
    <div class="text-right text-truncate">{{ progressText }}</div>
    <br />
    <br />
    <br />
    <br />
    <br />

    <div class="font-weight-bold mb-1">Message:</div>
    <v-form ref="form" v-model="validForm" @submit.prevent="">
      <v-row class="mb-8">
        <v-col cols="12" md="8">
          <v-text-field :disabled="signing" rounded dense outlined :rules="[rules.required]" v-model="message" />
        </v-col>
        <v-col cols="12" md="4">
          <v-btn
            block
            large
            depressed
            color="primary"
            class="text-truncate"
            rounded
            :disabled="!validForm || signing"
            :loading="signing"
            @click="signMessageTo"
          >
            {{ $vuetify.breakpoint.xlOnly ? "Sign message" : "Sign" }}
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "SignScreen",
  props: {
    setStep: {
      type: Function,
    },
    progressPercent: {
      type: Number,
    },
    progressText: {
      type: String,
    },
    signMessage: {
      type: Function,
    },
    generatePrecompute: {
      type: Function,
    },
  },
  data: () => ({
    region: { name: "South America", key: "sa" },
    regions: [
      { name: "Singapore", key: "sg" },
      { name: "North America", key: "na" },
      { name: "South America", key: "sa" },
      { name: "Europe", key: "eu" },
    ],
    message: "Hello Bogota",
    signing: false,
    rules: {
      required: (value: string) => !!value || "Required.",
    },
    validForm: true,
    clients: [],
  }),
  async mounted() {
    await this.generatePrecompute();
  },
  methods: {
    async signMessageTo() {
      this.signing = true;
      await this.signMessage(this.message);
      this.signing = false;
      this.setStep(3);
    },
  },
});
</script>
<style>
.tag {
  background: #f0f0f0;
  border-radius: 10px;
  padding: 5px 10px;
}
</style>
