import { DEFAULT_INFURA_ID } from "@web3auth/base";

import type { WalletConnectV1AdapterOptions } from "./interface";
export const defaultWalletConnectV1Options: WalletConnectV1AdapterOptions = {
  adapterSettings: {
    infuraId: DEFAULT_INFURA_ID,
  },
};
