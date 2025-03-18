import { signChallenge, verifySignedChallenge } from "@toruslabs/base-controllers";
import { EVM_METHOD_TYPES } from "@web3auth/ws-embed";

import {
  BaseConnector,
  checkIfTokenIsExpired,
  clearToken,
  CONNECTOR_EVENTS,
  CONNECTOR_STATUS,
  ConnectorInitOptions,
  getSavedToken,
  saveToken,
  UserAuthInfo,
  WalletInitializationError,
  WalletLoginError,
} from "@/core/base";

export abstract class BaseEvmConnector<T> extends BaseConnector<T> {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async init(_?: ConnectorInitOptions): Promise<void> {}

  async authenticateUser(): Promise<UserAuthInfo> {
    if (!this.provider || this.status !== CONNECTOR_STATUS.CONNECTED) throw WalletLoginError.notConnectedError();
    if (!this.coreOptions) throw WalletInitializationError.invalidParams("Please initialize Web3Auth with valid options");

    const accounts = await this.provider.request<never, string[]>({ method: EVM_METHOD_TYPES.GET_ACCOUNTS });
    if (accounts && accounts.length > 0) {
      const existingToken = getSavedToken(accounts[0] as string, this.name);
      if (existingToken) {
        const isExpired = checkIfTokenIsExpired(existingToken);
        if (!isExpired) {
          return { idToken: existingToken };
        }
      }

      const chainId = await this.provider.request<never, string>({ method: "eth_chainId" });
      const currentChainConfig = this.coreOptions.chains.find((x) => x.chainId === chainId);
      if (!currentChainConfig) throw WalletInitializationError.invalidParams("chainConfig is required before authentication");
      const { chainNamespace } = currentChainConfig;
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

      const signedMessage = await this.provider.request<[string, string], string>({
        method: EVM_METHOD_TYPES.PERSONAL_SIGN,
        params: [hexChallenge, accounts[0]],
      });

      const idToken = await verifySignedChallenge(
        chainNamespace,
        signedMessage as string,
        challenge,
        this.name,
        this.coreOptions.sessionTime,
        this.coreOptions.clientId,
        this.coreOptions.web3AuthNetwork
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
    this.emit(CONNECTOR_EVENTS.DISCONNECTED);
  }
}
