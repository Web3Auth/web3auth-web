import { ChainNamespaceType, signChallenge } from "@toruslabs/base-controllers";
import { bytesToHexPrefixedString, utf8ToBytes } from "@toruslabs/metadata-helpers";
import { EVM_METHOD_TYPES } from "@web3auth/ws-embed";
import { generateSiweNonce } from "viem/siwe";

import {
  AuthTokenInfo,
  BaseConnector,
  citadelServerUrl,
  CONNECTOR_EVENTS,
  CONNECTOR_STATUS,
  ConnectorInitOptions,
  WALLET_CONNECTOR_TYPE,
  WalletInitializationError,
  WalletLoginError,
} from "../../base";

export abstract class BaseEvmConnector<T> extends BaseConnector<T> {
  async init(_?: ConnectorInitOptions): Promise<void> {}

  async getAuthTokenInfo(): Promise<AuthTokenInfo> {
    if (!this.provider || !this.canAuthorize) throw WalletLoginError.notConnectedError();
    if (!this.coreOptions) throw WalletInitializationError.invalidParams("Please initialize Web3Auth with valid options");
    this.status = CONNECTOR_STATUS.AUTHORIZING;
    this.emit(CONNECTOR_EVENTS.AUTHORIZING, { connector: this.name as WALLET_CONNECTOR_TYPE });
    const accounts = await this.provider.request<never, string[]>({ method: EVM_METHOD_TYPES.GET_ACCOUNTS });
    if (accounts && accounts.length > 0) {
      const cached = await this.getCachedOrNullAuthTokenInfo(accounts[0] as string);
      if (cached) return cached;

      const authServer = citadelServerUrl(this.coreOptions.authBuildEnv);
      const { challenge, signature, chainNamespace } = await this.generateChallengeAndSign(authServer);
      return this.verifyAndAuthorize({ chainNamespace, signedMessage: signature, challenge, authServer });
    }
    throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
  }

  async generateChallengeAndSign(authServerUrl?: string): Promise<{ challenge: string; signature: string; chainNamespace: ChainNamespaceType }> {
    const accounts = await this.provider.request<never, string[]>({ method: EVM_METHOD_TYPES.GET_ACCOUNTS });
    if (!accounts || accounts.length === 0) {
      throw WalletLoginError.notConnectedError("No accounts found in the connected wallet");
    }
    const chainId = await this.provider.request<never, string>({ method: "eth_chainId" });
    const currentChainConfig = this.coreOptions.chains.find((x) => x.chainId === chainId);
    if (!currentChainConfig) throw WalletInitializationError.invalidParams("chainConfig is required before authentication");
    const { chainNamespace } = currentChainConfig;
    const authServer = authServerUrl || citadelServerUrl(this.coreOptions.authBuildEnv);
    const payload = {
      domain: window.location.origin,
      uri: window.location.href,
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      version: "1",
      nonce: generateSiweNonce(),
      issuedAt: new Date().toISOString(),
    };

    const challenge = await signChallenge(payload, chainNamespace, authServer);
    const hexChallenge = bytesToHexPrefixedString(utf8ToBytes(challenge));

    const signature = await this.provider.request<[string, string], string>({
      method: EVM_METHOD_TYPES.PERSONAL_SIGN,
      params: [hexChallenge, accounts[0]],
    });
    return { challenge, signature, chainNamespace };
  }

  async disconnectSession(): Promise<void> {
    super.checkDisconnectionRequirements();
    await this.clearWalletSession();
  }

  async disconnect(): Promise<void> {
    this.rehydrated = false;
    this.emit(CONNECTOR_EVENTS.DISCONNECTED);
  }
}
