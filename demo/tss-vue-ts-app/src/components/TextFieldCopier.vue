<template>
  <v-text-field class="text-subtitle-2" dense filled readonly rounded outlined append-icon="mdi-check" :value="text">
    <template v-slot:append>
      <div class="px-2 copy-btn d-flex align-center" @click="copyToClipboard">
        <v-icon class="mr-1" size="16">{{ copied ? "mdi-check" : "mdi-content-copy" }}</v-icon>
        {{ copied ? "Copied" : "Copy" }}
      </div>
    </template>
  </v-text-field>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "CopyToClipboard",
  props: {
    text: {
      type: String,
    },
  },
  data() {
    return {
      copied: false,
    };
  },
  methods: {
    async copyToClipboard() {
      await navigator.clipboard.writeText(this.text);
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 3000);
    },
  },
});
</script>
<style>
.copy-btn {
  cursor: pointer;
}
.copy-btn:hover {
  background: #f0f0f0;
  border-radius: 8px;
}
.v-input__append-inner {
  margin-top: 12px !important;
}
.v-input.v-input--is-focused .v-icon {
  color: #1976d2 !important;
}
</style>
