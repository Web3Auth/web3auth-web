import { Wallet } from "@web3auth/base";
import { TorusCtorArgs, TorusParams, TorusWalletAdapter } from "@web3auth/torus-wallet-adapter";

const getTorusWallet = (params: { widgetOptions: TorusCtorArgs; initParams: TorusParams }): Wallet => {
  return {
    name: "torus-wallet",
    adapter: async () => {
      const torusAdapter = new TorusWalletAdapter(params.widgetOptions);
      await torusAdapter.init(params.initParams);
      return torusAdapter;
    },
  };
};

export { getTorusWallet };
