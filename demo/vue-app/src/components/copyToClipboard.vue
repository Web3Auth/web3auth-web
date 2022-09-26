<template>
  <div class="tooltip">
    <button class="tooltip-btn" @click="copy" @mouseout="outFunc">
      <span class="tooltiptext">{{ copied ? "Copied " + text : "Copy to clipboard" }}</span>
      Copy
    </button>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "CopyToClipboard",
  props: {
    text: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      copied: false,
    };
  },
  methods: {
    copy() {
      navigator.clipboard.writeText(this.text);
      this.copied = true;
    },
    outFunc() {
      this.copied = false;
    },
  },
});
</script>

<style>
.tooltip {
  position: relative;
  display: inline-block;
  margin-left: 10px;
}

.tooltip-btn {
  padding: 0.3rem 0.8rem;
  border-radius: 8px;
  border-width: 2px;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 140px;
  background-color: #555;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px;
  position: absolute;
  z-index: 1;
  bottom: 120%;
  left: 50%;
  margin-left: -75px;
  opacity: 0;
  transition: opacity 0.3s;
}

.tooltip .tooltiptext::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #555 transparent transparent transparent;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}
</style>
