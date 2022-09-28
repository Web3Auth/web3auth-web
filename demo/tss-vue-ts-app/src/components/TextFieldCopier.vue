<template>
  <v-text-field
    class="rounded-lg text-subtitle-2"
    dense
    readonly
    filled
    outlined
    :append-icon="copied ? 'mdi-check': 'mdi-content-copy'"
    @click:append='copyToClipboard'
    :value="text"
  >
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
      alert(this.text)
      this.copied = true
      setTimeout(() => {
        this.copied = false
      }, 3000)
    }
  }
})
</script>
