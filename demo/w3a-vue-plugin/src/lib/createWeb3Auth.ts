import { Web3Auth } from "@web3auth/modal";
import { type Plugin, ref } from "vue";

import { Web3AuthContextKey, type Web3AuthPluginOptions } from "./types";
const web3AuthInstance = ref<Web3Auth | null>(null);

export function createWeb3Auth(options: Web3AuthPluginOptions): Plugin {
  return {
    install(app) {
      const { adapters = [], plugins = [], web3AuthOptions } = options;
      web3AuthInstance.value = new Web3Auth(web3AuthOptions);
      // web3AuthOption.value = options;
      if (adapters.length) adapters.map((adapter) => web3AuthInstance.value?.configureAdapter(adapter));
      if (plugins.length) {
        plugins.forEach((plugin) => {
          web3AuthInstance.value?.addPlugin(plugin);
        });
      }
      app.provide(Web3AuthContextKey, web3AuthInstance);
    },
  };
}
