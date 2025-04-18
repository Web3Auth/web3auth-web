import {
  SolanaSignAndSendTransaction,
  type SolanaSignAndSendTransactionFeature,
  SolanaSignMessage,
  type SolanaSignMessageFeature,
  SolanaSignTransaction,
  type SolanaSignTransactionFeature,
} from "@solana/wallet-standard-features";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { bs58 } from "@toruslabs/bs58";
import { type WalletWithFeatures } from "@wallet-standard/base";
import { type StandardConnectFeature, type StandardDisconnectFeature, type StandardEventsFeature } from "@wallet-standard/features";

import { WalletLoginError } from "../../../../base";
import { type ISolanaProviderHandlers } from "../../rpc";
import { BaseInjectedProvider } from "./base/baseInjectedProvider";
import { getBaseProviderHandlers } from "./base/providerHandlers";
import { getSolanaChainByChainConfig } from "./utils";

export type WalletStandard = WalletWithFeatures<
  StandardConnectFeature &
    StandardEventsFeature &
    StandardDisconnectFeature &
    SolanaSignAndSendTransactionFeature &
    SolanaSignMessageFeature &
    SolanaSignTransactionFeature
>;

export class WalletStandardProvider extends BaseInjectedProvider<WalletStandard> {
  protected getProviderHandlers(wallet: WalletStandard): ISolanaProviderHandlers {
    const chainIdentifier = getSolanaChainByChainConfig(this.config.chain);

    const currentAccount = () => {
      const account = wallet?.accounts[0];
      if (!account) throw WalletLoginError.notConnectedError();
      return account;
    };

    /**
     * Signs a message and returns the signature
     * @param message - The message to sign
     * @returns The signature of the message encoded in base58
     */
    const signMessage = async (message: string): Promise<string> => {
      const account = currentAccount();
      const uint8ArrayMessage = new Uint8Array(Buffer.from(message, "utf-8"));
      const signature = await wallet.features[SolanaSignMessage].signMessage({ account, message: uint8ArrayMessage });
      return bs58.encode(signature[0].signature);
    };

    /**
     * Signs a transaction and returns the signature
     * @param transaction - The transaction to sign
     * @returns The signature of the transaction encoded in base58
     */
    const signTransaction = async (transaction: string): Promise<string> => {
      const account = currentAccount();
      const output = await wallet.features[SolanaSignTransaction].signTransaction({
        account,
        transaction: new Uint8Array(Buffer.from(transaction, "base64")),
        chain: chainIdentifier,
      });
      return bs58.encode(VersionedTransaction.deserialize(output[0].signedTransaction).signatures[0]);
    };

    /**
     * Signs multiple transactions and returns the serialized transactions
     * @param transactions - The transactions to sign
     * @returns The serialized transactions encoded in base64
     */
    const signAllTransactions = async (transactions: string[]): Promise<string[]> => {
      const account = currentAccount();
      return Promise.all(
        transactions.map(async (transaction) => {
          const output = await wallet.features[SolanaSignTransaction].signTransaction({
            account,
            transaction: new Uint8Array(Buffer.from(transaction, "base64")),
            chain: chainIdentifier,
          });
          return Buffer.from(output[0].signedTransaction).toString("base64");
        })
      );
    };

    /**
     * Signs a transaction and sends it to the network
     * @param transaction - The transaction to sign and send
     * @returns The signature of the transaction encoded in base58
     */
    const signAndSendTransaction = async (transaction: string): Promise<string> => {
      const account = currentAccount();
      const output = await wallet.features[SolanaSignAndSendTransaction].signAndSendTransaction({
        account,
        transaction: new Uint8Array(Buffer.from(transaction, "base64")),
        chain: chainIdentifier,
      });
      return bs58.encode(output[0].signature);
    };

    return getBaseProviderHandlers({
      get publicKey() {
        return new PublicKey(currentAccount().publicKey);
      },
      signMessage,
      signTransaction,
      signAllTransactions,
      signAndSendTransaction,
    });
  }
}
