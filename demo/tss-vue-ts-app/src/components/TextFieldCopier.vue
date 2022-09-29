<template>
  <v-text-field
    class="text-subtitle-2"
    dense
    filled
    readonly
    rounded
    outlined
    :value="text"
  >
  <template v-slot:append>
    <div class="copy-btn" @click="copyToClipboard">
      <v-icon>{{ copied ? 'mdi-check': 'mdi-content-copy' }}</v-icon>
      {{ copied ? 'Copied' : 'Copy' }}
    </div>
  </template>
  </v-text-field>
</template>

<script lang='ts'>
import Vue from 'vue'

export default Vue.extend({
  name: 'CopyToClipboard',
  props: {
    text: {
      type: String
    }
  },
  data () {
    return {
      copied: false
    }
  },
  methods: {
    async copyToClipboard () {
      await navigator.clipboard.writeText(this.text)
      this.copied = true
      setTimeout(() => {
        this.copied = false
      }, 3000)
    }
  }
})
</script>
<style>
  .copy-btn {
    cursor: pointer;
  }
  .copy-btn:hover {
    background: #f0f0f0;
    border-radius: 8px;
  }
</style>
