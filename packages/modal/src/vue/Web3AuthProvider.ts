import { type Connection, Web3AuthContextKey } from "@web3auth/no-modal";
import { useWeb3AuthInnerContextValue } from "@web3auth/no-modal/vue";
import { defineComponent, h, PropType, provide, shallowRef } from "vue";

import { Web3Auth } from "../modalManager";
import { IWeb3AuthInnerContext, Web3AuthContextConfig } from "./interfaces";
import { WalletServicesInnerProvider } from "./WalletServicesInnerProvider";

export const Web3AuthProvider = defineComponent({
  name: "Web3AuthProvider",
  props: { config: { type: Object as PropType<Web3AuthContextConfig>, required: true } },
  setup(props) {
    const value = useWeb3AuthInnerContextValue({
      Web3AuthConstructor: Web3Auth,
      watchSource: () => props.config,
      getWeb3AuthOptions: (config) => config.web3AuthOptions,
      createConnectionRef: () => shallowRef<Connection | null>(null),
    });

    provide<IWeb3AuthInnerContext>(Web3AuthContextKey, value);
  },
  render() {
    return h(WalletServicesInnerProvider, {}, this.$slots.default ?? "");
  },
});
