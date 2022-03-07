import type { SafeEventEmitterProvider, UserInfo } from "@web3auth/base";
import type { Web3AuthCore } from "@web3auth/core";
export interface IPlugin {
  initWithProvider<T>(options: T, provider: SafeEventEmitterProvider, userInfo: UserInfo): Promise<void>;
  initWithWeb3Auth<T>(options: T, web3auth: Web3AuthCore): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
