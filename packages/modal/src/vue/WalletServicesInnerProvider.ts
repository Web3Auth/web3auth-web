import { type WalletServicesPluginType } from "@web3auth/no-modal";
import { WalletServicesPluginError } from "@web3auth/no-modal";
import { useWalletServicesInnerContextValue, WalletServicesContextKey } from "@web3auth/no-modal/vue";
import { defineComponent, h, provide } from "vue";

import { useWeb3AuthInner } from "./composables/useWeb3AuthInner";
import { IWalletServicesInnerContext } from "./interfaces";

export const WalletServicesInnerProvider = defineComponent({
  name: "WalletServicesInnerProvider",
  setup() {
    const web3AuthContext = useWeb3AuthInner();
    if (!web3AuthContext) throw WalletServicesPluginError.fromCode(1000, "`WalletServicesProvider` must be wrapped by `Web3AuthProvider`");
    const value = useWalletServicesInnerContextValue<WalletServicesPluginType>(web3AuthContext);

    provide<IWalletServicesInnerContext>(WalletServicesContextKey, value);
  },
  render() {
    return h(this.$slots.default ?? "");
  },
});
