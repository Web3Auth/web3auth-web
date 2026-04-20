import { defineComponent, h, PropType, provide } from "vue";

import { Web3AuthContextKey } from "../base";
import { Web3AuthNoModal } from "../noModal";
import { IWeb3AuthInnerContext, Web3AuthContextConfig } from "./interfaces";
import { useWeb3AuthInnerContextValue } from "./useWeb3AuthInnerContextValue";
import { WalletServicesInnerProvider } from "./WalletServicesInnerProvider";

export const Web3AuthProvider = defineComponent({
  name: "Web3AuthProvider",
  props: { config: { type: Object as PropType<Web3AuthContextConfig>, required: true } },
  setup(props) {
    const value = useWeb3AuthInnerContextValue({
      Web3AuthConstructor: Web3AuthNoModal,
      watchSource: () => props.config,
      getWeb3AuthOptions: (config) => config.web3AuthOptions,
    });

    provide<IWeb3AuthInnerContext>(Web3AuthContextKey, value);
  },
  render() {
    return h(WalletServicesInnerProvider, {}, this.$slots.default ?? "");
  },
});
