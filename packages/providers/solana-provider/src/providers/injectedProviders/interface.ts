import type { SafeEventEmitter } from "@web3auth/auth";
import { RequestArguments } from "@web3auth/base";

export interface InjectedProvider extends SafeEventEmitter {
  request<T, U>(args: RequestArguments<T>): Promise<U>;
}
