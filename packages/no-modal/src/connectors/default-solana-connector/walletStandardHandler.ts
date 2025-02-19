import {
  SolanaSignAndSendTransaction,
  type SolanaSignAndSendTransactionFeature,
  SolanaSignMessage,
  type SolanaSignMessageFeature,
  SolanaSignTransaction,
  type SolanaSignTransactionFeature,
} from "@solana/wallet-standard-features";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { IdentifierString, type WalletWithFeatures } from "@wallet-standard/base";
import { type StandardConnectFeature, type StandardDisconnectFeature, type StandardEventsFeature } from "@wallet-standard/features";
import { SafeEventEmitter } from "@web3auth/auth";
import BN from "bn.js";

import { WalletLoginError } from "@/core/base";
import { IWalletStandardProviderHandler, TransactionOrVersionedTransaction } from "@/core/solana-provider";

export type WalletStandard = WalletWithFeatures<
  StandardConnectFeature &
    StandardEventsFeature &
    StandardDisconnectFeature &
    SolanaSignAndSendTransactionFeature &
    SolanaSignMessageFeature &
    SolanaSignTransactionFeature
>;

export class WalletStandardProviderHandler extends SafeEventEmitter implements IWalletStandardProviderHandler {
  private wallet: WalletStandard | null = null;

  private getCurrentChain: () => IdentifierString;

  constructor({ wallet, getCurrentChain }: { wallet: WalletStandard; getCurrentChain: () => IdentifierString }) {
    super();
    this.wallet = wallet;
    this.getCurrentChain = getCurrentChain;
  }

  get currentAccount() {
    const account = this.wallet?.accounts[0];
    if (!account) throw WalletLoginError.notConnectedError();
    return account;
  }

  get publicKey() {
    return new PublicKey(this.currentAccount.publicKey);
  }

  async signMessage(message: Uint8Array): Promise<{ signature: Uint8Array; publicKey: BN }> {
    const account = this.currentAccount;
    const signature = await this.wallet.features[SolanaSignMessage].signMessage({ account, message });
    return { signature: signature[0].signature, publicKey: new BN(Buffer.from(account.publicKey)) };
  }

  async signTransaction<T extends TransactionOrVersionedTransaction>(transaction: T): Promise<T> {
    const account = this.currentAccount;
    const output = await this.wallet.features[SolanaSignTransaction].signTransaction({
      account,
      transaction: transaction.serialize({ requireAllSignatures: false }),
      chain: this.getCurrentChain(),
    });
    const isVersionedTransaction = (transaction as VersionedTransaction).version !== undefined || transaction instanceof VersionedTransaction;
    if (isVersionedTransaction) {
      return VersionedTransaction.deserialize(output[0].signedTransaction) as T;
    }
    return Transaction.from(output[0].signedTransaction) as T;
  }

  async signAllTransactions<T extends TransactionOrVersionedTransaction>(transactions: T[]): Promise<T[]> {
    return Promise.all(transactions.map((transaction) => this.signTransaction(transaction)));
  }

  async signAndSendTransaction<T extends TransactionOrVersionedTransaction>(
    transaction: T
  ): Promise<{
    signature: string;
  }> {
    const account = this.currentAccount;
    const output = await this.wallet.features[SolanaSignAndSendTransaction].signAndSendTransaction({
      account,
      transaction: transaction.serialize({ requireAllSignatures: false }),
      chain: this.getCurrentChain(),
    });
    const [{ signature }] = output;
    return { signature: new TextDecoder().decode(signature) };
  }
}
