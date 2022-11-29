import {
  ADAPTER_STATUS,
  ADAPTER_STATUS_TYPE,
  BaseAdapter,
  checkIfTokenIsExpired,
  clearToken,
  getSavedToken,
  SafeEventEmitterProvider,
  saveToken,
  signChallenge,
  UserAuthInfo,
  verifySignedChallenge,
  WalletLoginError,
} from "@web3auth/base";

export abstract class BaseEvmAdapter<T> extends BaseAdapter<T> {
  public clientId: string;

  public abstract status: ADAPTER_STATUS_TYPE;

  public abstract provider: SafeEventEmitterProvider;

  constructor(params: { clientId?: string } = {}) {
    super();
    this.clientId = params.clientId;
  }

  async authenticateUser(): Promise<UserAuthInfo> {
    if (!this.provider || !super.chainConfig?.chainId) throw WalletLoginError.notConnectedError();
    const { chainNamespace, chainId } = super.chainConfig;

    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
    const accounts = await this.provider.request<string[]>({
      method: "eth_accounts",
    });
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

      const signedMessage = await this.provider.request<string>({
        method: "personal_sign",
        params: [challenge, accounts[0]],
      });

      const idToken = await verifySignedChallenge(chainNamespace, signedMessage as string, challenge, this.name, super.sessionTime, this.clientId);
      saveToken(accounts[0] as string, this.name, idToken);
      return {
        idToken,
      };
    }
    throw WalletLoginError.notConnectedError("Not connected with wallet, Please login/connect first");
  }

  async disconnect(): Promise<void> {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.disconnectionError("Not connected with wallet");
    const accounts = await this.provider.request<string[]>({
      method: "eth_accounts",
    });
    if (accounts && accounts.length > 0) {
      clearToken(accounts[0], this.name);
    }
  }
}
