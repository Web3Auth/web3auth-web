import { getED25519Key } from "@toruslabs/openlogin-ed25519";
import { ADAPTER_EVENTS, ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA, WALLET_ADAPTERS, WalletInitializationError } from "@web3auth/base";
import { OpenloginBaseAdapter } from "@web3auth/openlogin-base-adapter";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import merge from "lodash.merge";

export interface OpenloginLoginParams {
  login_hint: string;
  loginProvider: string;
}

export class OpenloginSolanaAdapter extends OpenloginBaseAdapter {
  currentChainNamespace = CHAIN_NAMESPACES.SOLANA;

  async connectWithProvider(params?: OpenloginLoginParams): Promise<void> {
    if (!this.chainConfig) throw WalletInitializationError.invalidParams("chainConfig is required before initialization");
    if (!this.openloginInstance) throw WalletInitializationError.notReady("openloginInstance is not ready");

    this.privKeyProvider = new SolanaPrivateKeyProvider({ config: { chainConfig: this.chainConfig } });

    // if not logged in then login
    if (!this.openloginInstance.privKey && params) {
      await this.openloginInstance.login(
        merge(this.loginSettings, { loginProvider: params.loginProvider }, { extraLoginOptions: { login_hint: params?.login_hint } })
      );
    }
    if (this.openloginInstance.privKey) {
      if (!this.privKeyProvider) throw new Error("privKeyProvider is not set");
      const finalPrivKey = getED25519Key(this.openloginInstance.privKey).sk.toString("hex");
      await this.privKeyProvider.setupProvider(finalPrivKey);
      this.status = ADAPTER_STATUS.CONNECTED;
      this.emit(ADAPTER_EVENTS.CONNECTED, { adapter: WALLET_ADAPTERS.OPENLOGIN, reconnected: !params } as CONNECTED_EVENT_DATA);
    }
  }
}
