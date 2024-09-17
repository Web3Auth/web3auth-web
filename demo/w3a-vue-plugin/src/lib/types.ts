import { IAdapter, IPlugin, WALLET_ADAPTER_TYPE } from "@web3auth/base";
import { ModalConfig, Web3AuthOptions } from "@web3auth/modal";

export type Web3AuthPluginOptions = {
  web3AuthOptions: Web3AuthOptions;
  modalConfig?: Record<WALLET_ADAPTER_TYPE, ModalConfig>;
  adapters?: IAdapter<unknown>[];
  plugins?: IPlugin[];
};

export const Web3AuthContextKey = Symbol("web3auth");
