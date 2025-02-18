import { signChallenge, verifySignedChallenge } from "@toruslabs/base-controllers";

import {
  ADAPTER_EVENTS,
  ADAPTER_STATUS,
  AdapterInitOptions,
  BaseAdapter,
  checkIfTokenIsExpired,
  clearToken,
  getSavedToken,
  saveToken,
  UserAuthInfo,
  WalletInitializationError,
  WalletLoginError,
} from "@/core/base";

export abstract class BaseEvmAdapter<T> extends BaseAdapter<T> {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async init(_?: AdapterInitOptions): Promise<void> {}

  async authenticateUser(): Promise<UserAuthInfo> {
    if (!this.provider || this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError();
    const coreOptions = this.getCoreOptions?.();
    if (!coreOptions) throw WalletInitializationError.invalidParams("Please initialize Web3Auth with a valid options");
    const currentChainConfig = this.getCurrentChainConfig?.();
    if (!currentChainConfig) throw WalletInitializationError.invalidParams("chainConfig is required before authentication");

    const { chainNamespace, chainId } = currentChainConfig;
    const accounts = await this.provider.request<never, string[]>({ method: "eth_accounts" });
    if (accounts && accounts.length > 0) {
      const existingToken = getSavedToken(accounts[0] as string, this.name);
      if (existingToken) {
        const isExpired = checkIfTokenIsExpired(existingToken);
        if (!isExpired) {
          return { idToken: existingToken };
        }
      }

      const payload = {
        domain: window.location.origin,
        uri: window.location.href,
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        version: "1",
        nonce: Math.random().toString(36).slice(2),
        issuedAt: new Date().toISOString(),
      };

      const challenge = await signChallenge(payload, chainNamespace);
      const hexChallenge = `0x${Buffer.from(challenge, "utf8").toString("hex")}`;

      const signedMessage = await this.provider.request<[string, string], string>({ method: "personal_sign", params: [hexChallenge, accounts[0]] });

      const idToken = await verifySignedChallenge(
        chainNamespace,
        signedMessage as string,
        challenge,
        this.name,
        coreOptions.sessionTime,
        coreOptions.clientId,
        coreOptions.web3AuthNetwork
      );
      saveToken(accounts[0] as string, this.name, idToken);
      return { idToken };
    }
    throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
  }

  async disconnectSession(): Promise<void> {
    super.checkDisconnectionRequirements();
    const accounts = await this.provider.request<never, string[]>({ method: "eth_accounts" });
    if (accounts && accounts.length > 0) {
      clearToken(accounts[0], this.name);
    }
  }

  async disconnect(): Promise<void> {
    this.rehydrated = false;
    this.emit(ADAPTER_EVENTS.DISCONNECTED);
  }
}
