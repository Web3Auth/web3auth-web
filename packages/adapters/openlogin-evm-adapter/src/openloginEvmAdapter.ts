import { ADAPTER_EVENTS, ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA, WALLET_ADAPTERS, WalletInitializationError } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { OpenloginBaseAdapter } from "@web3auth/openlogin-base-adapter";
import merge from "lodash.merge";

export interface OpenloginLoginParams {
  login_hint: string;
  loginProvider: string;
}

export class OpenloginEvmAdapter extends OpenloginBaseAdapter {
  currentChainNamespace = CHAIN_NAMESPACES.EIP155;

  async connectWithProvider(params?: OpenloginLoginParams): Promise<void> {
    if (!this.chainConfig) throw WalletInitializationError.invalidParams("chainConfig is required before initialization");
    if (!this.openloginInstance) throw WalletInitializationError.notReady("openloginInstance is not ready");

    this.privKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });

    // if not logged in then login
    if (!this.openloginInstance.privKey && params) {
      await this.openloginInstance.login(
        merge(this.loginSettings, { loginProvider: params.loginProvider }, { extraLoginOptions: { login_hint: params?.login_hint } })
      );
    }
    if (this.openloginInstance.privKey) {
      await this.privKeyProvider.setupProvider(this.openloginInstance.privKey);
      this.status = ADAPTER_STATUS.CONNECTED;
      this.emit(ADAPTER_EVENTS.CONNECTED, { adapter: WALLET_ADAPTERS.OPENLOGIN, reconnected: !params } as CONNECTED_EVENT_DATA);
    }
  }
}
