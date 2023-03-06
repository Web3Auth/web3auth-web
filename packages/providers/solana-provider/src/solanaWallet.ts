import { RequestArguments, SafeEventEmitterProvider } from "@web3auth/base";

import { ISolanaWallet, TransactionOrVersionedTransaction } from "./interface";

export class SolanaWallet implements ISolanaWallet {
  public provider: SafeEventEmitterProvider;

  constructor(provider: SafeEventEmitterProvider) {
    this.provider = provider;
  }

  public async requestAccounts(): Promise<string[]> {
    const accounts = await this.provider.request<string[]>({
      method: "requestAccounts",
      params: {},
    });
    return accounts;
  }

  public async signAndSendTransaction<T extends TransactionOrVersionedTransaction>(transaction: T): Promise<{ signature: string }> {
    const { signature } = await this.provider.request<{ signature: string }>({
      method: "signAndSendTransaction",
      params: {
        message: transaction,
      },
    });
    return { signature };
  }

  public async signTransaction<T extends TransactionOrVersionedTransaction>(transaction: T): Promise<T> {
    const signedTransaction = await this.provider.request({
      method: "signTransaction",
      params: {
        message: transaction,
      },
    });
    return signedTransaction as T;
  }

  public async signAllTransactions<T extends TransactionOrVersionedTransaction>(transactions: T[]): Promise<T[]> {
    const signedTransactions = await this.provider.request({
      method: "signAllTransactions",
      params: {
        message: transactions,
      },
    });
    return signedTransactions as T[];
  }

  public async signMessage(data: Uint8Array): Promise<Uint8Array> {
    const response = await this.provider.request<Uint8Array>({
      method: "signMessage",
      params: {
        message: data,
      },
    });
    return response as Uint8Array;
  }

  public async request<T>(args: RequestArguments): Promise<T> {
    const result = await this.provider.request<T>(args);
    return result as T;
  }
}
