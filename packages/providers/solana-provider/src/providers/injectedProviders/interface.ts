import { RequestArguments } from "@web3auth/base";

export interface InjectedProvider {
  request<T>(args: RequestArguments): Promise<T>;
}
