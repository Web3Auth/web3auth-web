import type { OpenLoginOptions } from "@toruslabs/openlogin";
import {
  BaseAdapterConfig,
  BaseDefaultAdapters,
  CHAIN_NAMESPACES,
  CustomChainConfig,
  DefaultAdaptersError,
  DefaultAdaptersInitOptions,
  DefaultAdaptersOptions,
  getChainConfig,
  IAdapter,
  WALLET_ADAPTER_TYPE,
  WALLET_ADAPTERS,
} from "@web3auth/base";
import cloneDeep from "lodash.clonedeep";
import log from "loglevel";

import { defaultEvmDappAdaptersConfig, defaultEvmWalletAdaptersConfig } from "./config";

export class EvmDefaultAdapters extends BaseDefaultAdapters {
  options: DefaultAdaptersOptions;

  constructor(options: DefaultAdaptersOptions = { factoryMode: "DAPP" }) {
    super({ chainNamespace: CHAIN_NAMESPACES.EIP155 });
    this.options = options;
  }

  async _init(options: DefaultAdaptersInitOptions): Promise<void> {
    const optCopy: DefaultAdaptersInitOptions = cloneDeep(options);
    let defaultAdaptersConfig: Record<string, BaseAdapterConfig>;
    if (this.options.factoryMode === "DAPP") {
      defaultAdaptersConfig = defaultEvmDappAdaptersConfig;
    } else if (this.options.factoryMode === "WALLET") {
      defaultAdaptersConfig = defaultEvmWalletAdaptersConfig;
    } else {
      throw DefaultAdaptersError.invalidParams(`Invalid factory mode: ${this.options.factoryMode}`);
    }
    const allDefaultAdapters = [...Object.keys(defaultAdaptersConfig || {})];
    log.debug("allDefaultAdapters", allDefaultAdapters);
    allDefaultAdapters.forEach((adapterName) => {
      optCopy.adaptersConfig[adapterName] = {
        ...(defaultAdaptersConfig[adapterName] || {
          label: adapterName,
          showOnModal: true,
          showOnMobile: true,
          showOnDesktop: true,
        }),
        ...(optCopy.adaptersConfig[adapterName] || {}),
      };
      optCopy.initConfig[adapterName] = {
        ...optCopy.initConfig[adapterName],
        initializeAdapter: optCopy.initConfig[adapterName]?.initializeAdapter !== false,
      } || { initializeAdapter: true };
    });
    log.debug("optCopy", optCopy);

    return super.init(optCopy);
  }

  getDefaultAdapterModule = async (params: {
    name: WALLET_ADAPTER_TYPE;
    clientId: string;
    customChainConfig: Partial<CustomChainConfig> & Pick<CustomChainConfig, "chainNamespace">;
  }): Promise<IAdapter<unknown>> => {
    const { name, customChainConfig, clientId } = params;
    if (!Object.values(CHAIN_NAMESPACES).includes(customChainConfig.chainNamespace))
      throw new Error(`Invalid chainNamespace: ${customChainConfig.chainNamespace}`);

    const finalChainConfig = {
      ...(getChainConfig(customChainConfig.chainNamespace, customChainConfig?.chainId) as CustomChainConfig),
      ...(customChainConfig || {}),
    };
    if (name === WALLET_ADAPTERS.TORUS_EVM) {
      const { TorusWalletAdapter } = await import("@web3auth/torus-evm-adapter");
      const adapter = new TorusWalletAdapter({ chainConfig: finalChainConfig });
      return adapter;
    } else if (name === WALLET_ADAPTERS.METAMASK) {
      const { MetamaskAdapter } = await import("@web3auth/metamask-adapter");
      const adapter = new MetamaskAdapter({ chainConfig: finalChainConfig });
      return adapter;
    } else if (name === WALLET_ADAPTERS.WALLET_CONNECT_V1) {
      const { WalletConnectV1Adapter } = await import("@web3auth/wallet-connect-v1-adapter");
      const adapter = new WalletConnectV1Adapter({ chainConfig: finalChainConfig });
      return adapter;
    } else if (name === WALLET_ADAPTERS.OPENLOGIN) {
      const { OpenloginAdapter, getOpenloginDefaultOptions } = await import("@web3auth/openlogin-adapter");
      const defaultOptions = getOpenloginDefaultOptions(customChainConfig.chainNamespace, customChainConfig?.chainId);
      const adapter = new OpenloginAdapter({
        ...defaultOptions,
        adapterSettings: { ...defaultOptions.adapterSettings, clientId } as OpenLoginOptions,
      });
      return adapter;
    }
    throw new Error(`Invalid wallet adapter name: ${name}`);
  };
}
