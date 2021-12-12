import { IWalletAdapter, LOGIN_PROVIDER, LoginMethodConfig, WALLET_ADAPTERS } from "@web3auth/base";
import type { CustomauthAdapter } from "@web3auth/customauth-adapter";

export const getAdapterSocialLogins = (
  adapterName: string,
  adapter: IWalletAdapter,
  loginMethodsConfig: Record<string, LoginMethodConfig> = {}
): Record<string, LoginMethodConfig> => {
  const finalLoginMethodsConfig: Record<string, LoginMethodConfig> = {};
  if (adapterName === WALLET_ADAPTERS.CUSTOM_AUTH) {
    const customAuthAdapter = adapter as CustomauthAdapter;
    Object.keys(customAuthAdapter.loginSettings?.loginProviderConfig).forEach((loginMethod) => {
      const currentLoginMethodConfig = loginMethodsConfig[loginMethod] || {};
      finalLoginMethodsConfig[loginMethod] = { visible: true, showOnDesktop: true, showOnMobile: true, ...currentLoginMethodConfig };
    });
  } else if (adapterName === WALLET_ADAPTERS.OPENLOGIN_WALLET) {
    // eslint-disable-next-line no-console
    console.log("OPENLOGIN_WALLET", LOGIN_PROVIDER);
    [...Object.values(LOGIN_PROVIDER)].forEach((loginMethod) => {
      const currentLoginMethodConfig = loginMethodsConfig[loginMethod] || {};
      finalLoginMethodsConfig[loginMethod] = { visible: true, showOnDesktop: true, showOnMobile: true, ...currentLoginMethodConfig };
    });
  } else {
    throw new Error(`${adapterName} is not a valid adapter`);
  }
  // eslint-disable-next-line no-console
  console.log(finalLoginMethodsConfig, adapterName);
  return finalLoginMethodsConfig;
};
