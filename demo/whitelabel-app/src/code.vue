<template>
  <div>
    <textarea id="jsEditor"></textarea>
    <div class="text-right">
      <a class="text-sm cursor-pointer text-app-primary" @click="copyCode">Copy</a>
    </div>
  </div>
  <ul class="list-disc">
    <li>Vue code generated above is dynamically updated based on the whitelabel settings.</li>
    <li>You can copy/paste generated code in your vue app for a live working example.</li>
  </ul>
</template>

<script lang="ts">
import copyToClipboard from "copy-to-clipboard";

import type CodeMirror from "codemirror";
import { fromTextArea } from "codemirror";

import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript.js";
import { format } from "prettier/standalone";
import parserHtml from "prettier/parser-html";

import { generateVueCode } from "../src/templates/web3AuthVueTemplate";
import { defineComponent } from "vue";

let jsEditor: CodeMirror.Editor;

const initEditor = () => {
  jsEditor = fromTextArea(document.getElementById("jsEditor") as HTMLTextAreaElement, {
    lineNumbers: true,
    theme: "dracula",
    mode: "javascript",
    readOnly: true,
  });
};

export default defineComponent({
  name: "App",
  props: ["uiConfig"],
  mounted() {
    initEditor();
    this.setCode();
  },
  watch: {
    uiConfig: function () {
      this.setCode();
    },
  },
  methods: {
    async setCode() {
      const formattedCode = this.getCode();
      jsEditor.setValue(formattedCode);
    },
    copyCode() {
      copyToClipboard(this.getCode());
    },
    getCode(): string {
      const uiConfig = {
        ...this.uiConfig,
      };
      const renderCode = generateVueCode(uiConfig);

      return format(renderCode, { plugins: [parserHtml], parser: "vue" });
    },
  },
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
}
.CodeMirror {
  height: 500px;
}
.app-text-field {
  @apply rounded-lg outline-none w-full py-2 px-5 border border-gray-500 text-gray-700 focus:ring-1 focus:ring-app-primary focus:border-app-primary;
}
.app-btn {
  @apply py-2 px-5 w-full outline-none text-base text-app-primary bg-white rounded-lg border border-app-primary hover:bg-gray-100 focus:ring-1 focus:ring-app-primary;
}
</style>
