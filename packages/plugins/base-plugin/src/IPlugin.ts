import type { SafeEventEmitterProvider, UserInfo } from "@web3auth/base";
export interface IPlugin<T> {
  name: string;
  initWithProvider(provider: SafeEventEmitterProvider, userInfo: UserInfo): Promise<void>;
  initWithWeb3Auth(web3auth: T): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
