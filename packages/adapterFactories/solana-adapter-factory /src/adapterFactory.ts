import type { OpenLoginOptions } from "@toruslabs/openlogin";
import {
  AdapterConfig,
  AdapterFactoryError,
  AdapterFactoryInitOptions,
  AdapterFactoryOptions,
  BaseAdapterFactory,
  CHAIN_NAMESPACES,
  CustomChainConfig,
  getChainConfig,
  IAdapter,
  WALLET_ADAPTER_TYPE,
  WALLET_ADAPTERS,
} from "@web3auth/base";
import cloneDeep from "lodash.clonedeep";

import { defaultSolanaDappAdaptersConfig, defaultSolanaWalletAdaptersConfig } from "./config";

export class SolanaAdapterFactory extends BaseAdapterFactory {
  options: AdapterFactoryOptions;

  constructor(options: AdapterFactoryOptions = { factoryMode: "DAPP" }) {
    super({ factoryChainNamespace: CHAIN_NAMESPACES.SOLANA });
    this.options = options;
  }

  async init(options: AdapterFactoryInitOptions): Promise<void> {
    const optCopy: AdapterFactoryInitOptions = cloneDeep(options);
    let defaultAdaptersConfig: Record<string, AdapterConfig>;
    if (this.options.factoryMode === "DAPP") {
      defaultAdaptersConfig = defaultSolanaDappAdaptersConfig;
    } else if (this.options.factoryMode === "WALLET") {
      defaultAdaptersConfig = defaultSolanaWalletAdaptersConfig;
    } else {
      throw AdapterFactoryError.invalidParams(`Invalid factory mode: ${this.options.factoryMode}`);
    }

    const allAdapters = [...new Set([...Object.keys(defaultAdaptersConfig || {}), ...Object.keys(this.walletAdapters)])];
    Object.keys(allAdapters).forEach((adapterName) => {
      optCopy.adaptersConfig[adapterName] = {
        ...(defaultAdaptersConfig[adapterName] || {
          label: adapterName,
          showOnModal: true,
          showOnMobile: true,
          showOnDesktop: true,
        }),
        ...(optCopy.adaptersConfig[adapterName] || {}),
      };
    });
    return super.init(options);
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
    throw new Error("Invalid wallet adapter name");
  };
}
