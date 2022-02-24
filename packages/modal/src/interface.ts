import type { BaseAdapterConfig, LoginMethodConfig } from "@web3auth/base";
export interface AdapterConfig extends BaseAdapterConfig {
  loginMethods?: LoginMethodConfig;
}
