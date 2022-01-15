import log from "loglevel";

import { AdapterConfig } from "..";
import { ChainNamespaceType, CustomChainConfig } from "../chain/IChainInterface";
import { AdapterFactoryError } from "../errors";
import { ADAPTER_STATUS, ADAPTER_STATUS_TYPE, IAdapter, WALLET_ADAPTER_TYPE } from "./IAdapter";
export interface AdapterFactoryOptions {
  factoryMode?: "DAPP" | "WALLET";
}
export type AdapterFactoryConfig = Record<
  WALLET_ADAPTER_TYPE,
  {
    initializeAdapter: boolean;
  }
>;

export interface AdapterFactoryInitOptions {
  chainConfig: Partial<CustomChainConfig> & Pick<CustomChainConfig, "chainNamespace">;
  clientId: string;
  adapterFactoryConfig: AdapterFactoryConfig;
  adaptersConfig: Record<WALLET_ADAPTER_TYPE, AdapterConfig>;
}

export interface IAdapterFactory {
  options: AdapterFactoryOptions;
  status: ADAPTER_STATUS_TYPE;
  walletAdapters: Record<WALLET_ADAPTER_TYPE, IAdapter<unknown>>;
  adaptersConfig: Record<WALLET_ADAPTER_TYPE, AdapterConfig>;
  init(options: AdapterFactoryInitOptions): Promise<void>;
}

export abstract class BaseAdapterFactory implements IAdapterFactory {
  status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  walletAdapters: Record<WALLET_ADAPTER_TYPE, IAdapter<unknown>> = {};

  adaptersConfig: Record<WALLET_ADAPTER_TYPE, AdapterConfig> = {};

  private factoryChainNamespace: ChainNamespaceType;

  abstract options: AdapterFactoryOptions;

  constructor(options: { factoryChainNamespace: ChainNamespaceType }) {
    if (options.factoryChainNamespace) throw AdapterFactoryError.invalidParams("Please provide factoryChainNamespace in adapter factory");
    this.factoryChainNamespace = options.factoryChainNamespace;
  }

  public async init(options: AdapterFactoryInitOptions): Promise<void> {
    if (this.status === ADAPTER_STATUS.READY) throw AdapterFactoryError.alreadyInitialized();
    if (!options.clientId) throw AdapterFactoryError.invalidParams("Please provide clientId in adapter factory");
    if (!options.chainConfig?.chainNamespace)
      throw AdapterFactoryError.invalidParams("Please provide chainNamespace in adapter factory's chainConfig");
    if (options.chainConfig?.chainNamespace !== this.factoryChainNamespace)
      throw AdapterFactoryError.invalidParams(
        `Expected chainNamespace to be ${this.factoryChainNamespace} and found ${options.chainConfig.chainNamespace}`
      );

    this.adaptersConfig = options.adaptersConfig;

    await Promise.all(
      Object.keys(this.adaptersConfig).map(async (adapterName) => {
        try {
          if (!this.walletAdapters[adapterName] && options.adapterFactoryConfig?.[adapterName]?.initializeAdapter) {
            const ad = await this.getDefaultAdapterModule({
              name: adapterName,
              customChainConfig: options.chainConfig,
              clientId: options.clientId,
            });
            this.walletAdapters[adapterName] = ad;
          }
        } catch (error) {
          log.error("Error while initializing wallet adapter", error);
        }
      })
    );
    this.status = ADAPTER_STATUS.READY;
  }

  abstract getDefaultAdapterModule(params: {
    name: WALLET_ADAPTER_TYPE;
    clientId: string;
    customChainConfig: Partial<CustomChainConfig> & Pick<CustomChainConfig, "chainNamespace">;
  }): Promise<IAdapter<unknown>>;
}
