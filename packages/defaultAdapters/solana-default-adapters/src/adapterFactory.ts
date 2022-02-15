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

import { defaultSolanaDappAdaptersConfig, defaultSolanaWalletAdaptersConfig } from "./config";

export class SolanaDefaultAdapters extends BaseDefaultAdapters {
  options: DefaultAdaptersOptions;

  constructor(options: DefaultAdaptersOptions = { factoryMode: "DAPP" }) {
    super({ chainNamespace: CHAIN_NAMESPACES.SOLANA });
    this.options = options;
  }

  async _init(options: DefaultAdaptersInitOptions): Promise<void> {
    const optCopy: DefaultAdaptersInitOptions = cloneDeep(options);
    let defaultAdaptersConfig: Record<string, BaseAdapterConfig>;
    if (this.options.factoryMode === "DAPP") {
      defaultAdaptersConfig = defaultSolanaDappAdaptersConfig;
    } else if (this.options.factoryMode === "WALLET") {
      defaultAdaptersConfig = defaultSolanaWalletAdaptersConfig;
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
        initializeAdapter: optCopy.initConfig[adapterName].initializeAdapter !== false,
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
    if (name === WALLET_ADAPTERS.TORUS_SOLANA) {
      const { SolanaWalletAdapter } = await import("@web3auth/torus-solana-adapter");
      const adapter = new SolanaWalletAdapter({ chainConfig: finalChainConfig });
      return adapter;
    } else if (name === WALLET_ADAPTERS.PHANTOM) {
      const { PhantomAdapter } = await import("@web3auth/phantom-adapter");
      const adapter = new PhantomAdapter({ chainConfig: finalChainConfig });
      return adapter;
    } else if (name === WALLET_ADAPTERS.OPENLOGIN) {
      const { OpenloginAdapter, getOpenloginDefaultOptions } = await import("@web3auth/openlogin-adapter");
      const defaultOptions = getOpenloginDefaultOptions(customChainConfig.chainNamespace, customChainConfig?.chainId);
      const adapter = new OpenloginAdapter({
        ...defaultOptions,
        adapterSettings: { ...(defaultOptions.adapterSettings as OpenLoginOptions), clientId },
      });
      return adapter;
    }
    throw new Error(`Invalid wallet adapter name: ${name}`);
  };
}
