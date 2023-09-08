import { IProvider, RequestArguments } from "@web3auth/base";

import { ISolanaWallet, TransactionOrVersionedTransaction } from "./interface";

export class SolanaWallet implements ISolanaWallet {
  public provider: IProvider;

  constructor(provider: IProvider) {
    this.provider = provider;
  }

  public async requestAccounts(): Promise<string[]> {
    const accounts = await this.provider.request<never, string[]>({
      method: "requestAccounts",
    });
    return accounts;
  }

  public async signAndSendTransaction<T extends TransactionOrVersionedTransaction>(transaction: T): Promise<{ signature: string }> {
    const { signature } = await this.provider.request<{ message: T }, { signature: string }>({
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
    const response = await this.provider.request<{ message: Uint8Array }, Uint8Array>({
      method: "signMessage",
      params: {
        message: data,
      },
    });
    return response as Uint8Array;
  }

  public async request<T, U>(args: RequestArguments<T>): Promise<U> {
    const result = await this.provider.request<T, U>(args);
    return result as U;
  }
}
