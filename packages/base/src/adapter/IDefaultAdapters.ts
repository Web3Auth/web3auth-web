import log from "loglevel";

import { ChainNamespaceType, CustomChainConfig } from "../chain/IChainInterface";
import { DefaultAdaptersError } from "../errors";
import { ADAPTER_STATUS, ADAPTER_STATUS_TYPE, BaseAdapterConfig, IAdapter, WALLET_ADAPTER_TYPE } from "./IAdapter";

export interface DefaultAdaptersOptions {
  factoryMode?: "DAPP" | "WALLET";
}
export type SkipAdaptersConfig = Record<
  WALLET_ADAPTER_TYPE,
  {
    initializeAdapter: boolean;
  }
>;

export const mergeDefaultAdapterConfig = (
  adapterName: string,
  sourceConfig: Record<string, BaseAdapterConfig>,
  providedConfig: Record<WALLET_ADAPTER_TYPE, BaseAdapterConfig>
) => {
  return {
    ...(sourceConfig[adapterName] || {
      label: adapterName,
      showOnModal: true,
      showOnMobile: true,
      showOnDesktop: true,
    }),
    ...(providedConfig[adapterName] || {}),
  };
};

export interface DefaultAdaptersInitOptions {
  chainConfig: Partial<CustomChainConfig> & Pick<CustomChainConfig, "chainNamespace">;
  clientId: string;
  skipAdapters: SkipAdaptersConfig;
  adaptersConfig: Record<WALLET_ADAPTER_TYPE, BaseAdapterConfig>;
}

export interface IDefaultAdapters {
  status: ADAPTER_STATUS_TYPE;
  walletAdapters: Record<WALLET_ADAPTER_TYPE, IAdapter<unknown>>;
  _init(options: DefaultAdaptersInitOptions): Promise<void>;
}

export abstract class BaseDefaultAdapters implements IDefaultAdapters {
  status: ADAPTER_STATUS_TYPE = ADAPTER_STATUS.NOT_READY;

  walletAdapters: Record<WALLET_ADAPTER_TYPE, IAdapter<unknown>> = {};

  private chainNamespace: ChainNamespaceType;

  constructor(options: { chainNamespace: ChainNamespaceType }) {
    if (!options.chainNamespace) throw DefaultAdaptersError.invalidParams("Please provide chainNamespace");
    this.chainNamespace = options.chainNamespace;
  }

  public async _init(options: DefaultAdaptersInitOptions): Promise<void> {
    if (this.status === ADAPTER_STATUS.READY) throw DefaultAdaptersError.alreadyInitialized();
    if (!options.clientId) throw DefaultAdaptersError.invalidParams("Please provide clientId");
    if (!options.chainConfig?.chainNamespace) throw DefaultAdaptersError.invalidParams("Please provide chainNamespace in chainConfig");
    if (options.chainConfig?.chainNamespace !== this.chainNamespace)
      throw DefaultAdaptersError.invalidParams(
        `Expected chainNamespace to be ${this.chainNamespace} and found ${options.chainConfig.chainNamespace}`
      );

    await Promise.all(
      Object.keys(options.adaptersConfig).map(async (adapterName) => {
        try {
          if (!this.walletAdapters[adapterName] && options.skipAdapters?.[adapterName]?.initializeAdapter) {
            const ad = await this._getDefaultAdapterModule({
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

  abstract _getDefaultAdapterModule(params: {
    name: WALLET_ADAPTER_TYPE;
    clientId: string;
    customChainConfig: Partial<CustomChainConfig> & Pick<CustomChainConfig, "chainNamespace">;
  }): Promise<IAdapter<unknown>>;
}
