<template>
  <v-text-field
    class="rounded-lg text-subtitle-2"
    dense
    filled
    readonly
    outlined
    :value="text"
  >
  <template v-slot:append>
    <div @click="copyToClipboard">
      <v-icon>{{ copied ? 'mdi-check': 'mdi-content-copy' }}</v-icon>
      Copy
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
      alert(this.text)
      await navigator.clipboard.writeText(this.text)
      this.copied = true
      setTimeout(() => {
        this.copied = false
      }, 3000)
    }
  }
})
</script>
