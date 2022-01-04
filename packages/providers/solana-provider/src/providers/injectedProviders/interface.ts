import { CustomChainConfig, RequestArguments } from "@web3auth/base";
import { BaseProviderConfig } from "@web3auth/base-provider";

export interface SolanaInjectedProviderConfig extends BaseProviderConfig {
  chainConfig: Partial<CustomChainConfig> & Pick<CustomChainConfig, "chainId">;
}

export interface InjectedProvider {
  request<T>(args: RequestArguments): Promise<T>;
}
