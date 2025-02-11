import type { SafeEventEmitter } from "@web3auth/auth";

import { RequestArguments } from "@/core/base";

export interface InjectedProvider extends SafeEventEmitter {
  request<T, U>(args: RequestArguments<T>): Promise<U>;
}
