import { IAdapter, LoginMethodConfig, WALLET_ADAPTERS } from "@web3auth/base";
import type { CustomAuthAdapter } from "@web3auth/customauth-adapter";
import log from "loglevel";

import { OPENLOGIN_PROVIDERS } from "./config";

export const getAdapterSocialLogins = (
  adapterName: string,
  adapter: IAdapter<unknown>,
  loginMethodsConfig: LoginMethodConfig = {}
): LoginMethodConfig => {
  const finalLoginMethodsConfig: LoginMethodConfig = {};
  if (adapterName === WALLET_ADAPTERS.CUSTOM_AUTH) {
    const customAuthAdapter = adapter as CustomAuthAdapter;
    Object.keys(customAuthAdapter.loginSettings?.loginProviderConfig).forEach((loginMethod: string) => {
      const currentLoginMethodConfig = loginMethodsConfig[loginMethod] || {
        name: loginMethod,
        showOnMobile: true,
        showOnModal: true,
        showOnDesktop: true,
      };
      finalLoginMethodsConfig[loginMethod] = { ...currentLoginMethodConfig };
    });
  } else if (adapterName === WALLET_ADAPTERS.OPENLOGIN) {
    OPENLOGIN_PROVIDERS.forEach((loginMethod) => {
      const currentLoginMethodConfig = loginMethodsConfig[loginMethod] || {
        name: loginMethod,
        showOnMobile: true,
        showOnModal: true,
        showOnDesktop: true,
      };
      finalLoginMethodsConfig[loginMethod] = { ...currentLoginMethodConfig };
      log.debug("OpenLogin login method ui config", finalLoginMethodsConfig);
    });
  } else {
    throw new Error(`${adapterName} is not a valid adapter`);
  }
  return finalLoginMethodsConfig;
};
