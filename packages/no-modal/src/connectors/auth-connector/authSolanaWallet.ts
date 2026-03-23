import { getBase58Encoder, getBase64Decoder, getBase64EncodedWireTransaction, getBase64Encoder, getTransactionDecoder } from "@solana/kit";
import {
  SolanaSignAndSendTransaction,
  type SolanaSignAndSendTransactionFeature,
  SolanaSignMessage,
  type SolanaSignMessageFeature,
  SolanaSignTransaction,
  type SolanaSignTransactionFeature,
} from "@solana/wallet-standard-features";
import { type IdentifierArray, type Wallet, type WalletAccount, type WalletIcon, type WalletVersion } from "@wallet-standard/base";
import {
  StandardConnect,
  type StandardConnectFeature,
  StandardDisconnect,
  type StandardDisconnectFeature,
  StandardEvents,
  type StandardEventsFeature,
  type StandardEventsListeners,
} from "@wallet-standard/features";
import { SOLANA_METHOD_TYPES } from "@web3auth/ws-embed";

import { type CustomChainConfig, type IProvider } from "../../base";
import { getSolanaChainByChainConfig } from "../../base";

const base58Encoder = getBase58Encoder();
const base64Decoder = getBase64Decoder();
const base64Encoder = getBase64Encoder();
const transactionDecoder = getTransactionDecoder();

const WEB3AUTH_ICON: WalletIcon = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTciIHZpZXdCb3g9IjAgMCA5NiA5NyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00NC4wMzQ2IDczLjI2MjRDNDMuODU5NSA3My45MTU5IDQ0LjM1MTkgNzQuNTU3NiA0NS4wMjg1IDc0LjU1NzZINTAuOTUzOUM1MS42MzA0IDc0LjU1NzYgNTIuMTIyOSA3My45MTU5IDUxLjk0NzggNzMuMjYyNEw0OC45ODUgNjIuMjA1M0M0OC43MTI2IDYxLjE4ODUgNDcuMjY5OCA2MS4xODg1IDQ2Ljk5NzMgNjIuMjA1M0w0NC4wMzQ2IDczLjI2MjRaIiBmaWxsPSIjMDM2NEZGIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzguMTM0NSA4MC4zMzk2QzM3LjY4MDcgODIuMDMzIDM2LjE0NjEgODMuMjEwNiAzNC4zOTI5IDgzLjIxMDZIMjYuMzcyNkMyMy44MjU2IDgzLjIxMDYgMjEuOTcxOSA4MC43OTQ3IDIyLjYzMTEgNzguMzM0NUwzOS4wODQ0IDE2LjkyOTlDMzkuNTgwNyAxNS4wNzc3IDQxLjI1OTEgMTMuNzg5NyA0My4xNzY3IDEzLjc4OTdINTIuNzIxOUM1NC42Mzk0IDEzLjc4OTcgNTYuMzE3OSAxNS4wNzc3IDU2LjgxNDIgMTYuOTI5OUw3My4yNjc1IDc4LjMzNDVDNzMuOTI2NyA4MC43OTQ3IDcyLjA3MjkgODMuMjEwNiA2OS41MjYgODMuMjEwNkg2MS41MDU2QzU5Ljc1MjQgODMuMjEwNiA1OC4yMTc4IDgyLjAzMyA1Ny43NjQxIDgwLjMzOTZMNDkuNzYxNiA1MC40NzM4QzQ5LjI2NDggNDguNjE5NyA0Ni42MzM4IDQ4LjYxOTcgNDYuMTM3IDUwLjQ3MzhMMzguMTM0NSA4MC4zMzk2WiIgZmlsbD0iIzAzNjRGRiIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTc4LjQ3NzQgNjguNzY4NUM3Ny45NjQ2IDcwLjY4MjQgNzUuMjQ4NyA3MC42ODI0IDc0LjczNTkgNjguNzY4NUw2OC43NjI2IDQ2LjQ3NTlDNjguNjQ3MSA0Ni4wNDQ5IDY4LjY0NzEgNDUuNTkxIDY4Ljc2MjYgNDUuMTZMNzYuMzc1MSAxNi43NUM3Ni44NDMgMTUuMDAzNiA3OC40MjU2IDEzLjc4OTMgODAuMjMzNSAxMy43ODkzSDg4LjAwMzJDOTAuNjI5OCAxMy43ODkzIDkyLjU0MTUgMTYuMjgwNyA5MS44NjE3IDE4LjgxNzhMNzguNDc3NCA2OC43Njg1Wk0yNy4yMjc0IDQ2LjQzODdDMjcuMzQyOSA0Ni4wMDc3IDI3LjM0MjkgNDUuNTUzOSAyNy4yMjc0IDQ1LjEyMjhMMTkuNjI0OSAxNi43NUMxOS4xNTcgMTUuMDAzNiAxNy41NzQ0IDEzLjc4OTMgMTUuNzY2NSAxMy43ODkzSDcuOTk2NzdDNS4zNzAyMyAxMy43ODkzIDMuNDU4NTEgMTYuMjgwNyA0LjEzODMxIDE4LjgxNzhMMTcuNTEyNiA2OC43MzEzQzE4LjAyNTQgNzAuNjQ1MiAyMC43NDEzIDcwLjY0NTIgMjEuMjU0MSA2OC43MzEzTDI3LjIyNzQgNDYuNDM4N1oiIGZpbGw9IiMwMzY0RkYiLz4KPC9zdmc+Cg==`;

type AuthSolanaFeatures = StandardConnectFeature &
  StandardDisconnectFeature &
  StandardEventsFeature &
  SolanaSignAndSendTransactionFeature &
  SolanaSignMessageFeature &
  SolanaSignTransactionFeature;

/**
 * AuthSolanaWallet implements the Wallet Standard interface, wrapping a JRPC provider.
 * Used by AuthConnector on Solana chains so consumers always get a standards-compliant
 * Wallet object from `connection.solanaWallet`.
 */
export class AuthSolanaWallet implements Wallet {
  readonly version: WalletVersion = "1.0.0";

  readonly name = "Web3Auth";

  readonly icon: WalletIcon = WEB3AUTH_ICON;

  readonly chains: IdentifierArray;

  readonly features: AuthSolanaFeatures;

  private _accounts: WalletAccount[];

  private readonly _listeners: { [E in keyof StandardEventsListeners]?: Set<StandardEventsListeners[E]> } = {};

  private constructor(provider: IProvider, chainIdentifier: string, accounts: WalletAccount[]) {
    this.chains = chainIdentifier ? ([chainIdentifier] as IdentifierArray) : ([] as unknown as IdentifierArray);
    this._accounts = accounts;

    this.features = {
      [StandardConnect]: {
        version: "1.0.0",
        connect: async () => ({ accounts: this._accounts }),
      },
      [StandardDisconnect]: {
        version: "1.0.0",
        disconnect: async () => {},
      },
      [StandardEvents]: {
        version: "1.0.0",
        on: <E extends keyof StandardEventsListeners>(event: E, listener: StandardEventsListeners[E]) => {
          (this._listeners[event] ??= new Set() as Set<StandardEventsListeners[E]>).add(listener);
          return () => (this._listeners[event] as Set<StandardEventsListeners[E]>).delete(listener);
        },
      },
      [SolanaSignAndSendTransaction]: {
        version: "1.0.0",
        supportedTransactionVersions: ["legacy", 0],
        signAndSendTransaction: async (...inputs) => {
          return Promise.all(
            inputs.map(async (input) => {
              const base64Tx = base64Decoder.decode(input.transaction);
              const signature = await provider.request<{ message: string }, string>({
                method: SOLANA_METHOD_TYPES.SEND_TRANSACTION,
                params: { message: base64Tx },
              });
              return { signature: new Uint8Array(base58Encoder.encode(signature)) };
            })
          );
        },
      },
      [SolanaSignMessage]: {
        version: "1.0.0",
        signMessage: async (...inputs) => {
          return Promise.all(
            inputs.map(async (input) => {
              const message = new TextDecoder().decode(input.message);
              const signature = await provider.request<{ data: string; from: string }, string>({
                method: SOLANA_METHOD_TYPES.SIGN_MESSAGE,
                params: { data: message, from: input.account.address },
              });
              return { signedMessage: new Uint8Array(input.message), signature: new Uint8Array(base58Encoder.encode(signature)) };
            })
          );
        },
      },
      [SolanaSignTransaction]: {
        version: "1.0.0",
        supportedTransactionVersions: ["legacy", 0],
        signTransaction: async (...inputs) => {
          return Promise.all(
            inputs.map(async (input) => {
              const base64Tx = base64Decoder.decode(input.transaction);
              const signatureBase58 = await provider.request<{ message: string }, string>({
                method: SOLANA_METHOD_TYPES.SIGN_TRANSACTION,
                params: { message: base64Tx },
              });
              // Reconstruct signed transaction by inserting signature into decoded tx
              const sigBytes = new Uint8Array(base58Encoder.encode(signatureBase58));
              const decodedTx = transactionDecoder.decode(input.transaction);
              const signedTx = {
                ...decodedTx,
                signatures: { ...decodedTx.signatures, [input.account.address]: sigBytes },
              };
              const signedBase64 = getBase64EncodedWireTransaction(signedTx as Parameters<typeof getBase64EncodedWireTransaction>[0]);
              return { signedTransaction: new Uint8Array(base64Encoder.encode(signedBase64)) };
            })
          );
        },
      },
    };
  }

  get accounts(): readonly WalletAccount[] {
    return this._accounts;
  }

  /**
   * Creates an AuthSolanaWallet by fetching accounts from the provider.
   */
  static async create(provider: IProvider, chainConfig: CustomChainConfig): Promise<AuthSolanaWallet> {
    const chainIdentifier = getSolanaChainByChainConfig(chainConfig);
    const addresses = (await provider.request<never, string[]>({ method: SOLANA_METHOD_TYPES.GET_ACCOUNTS })) ?? [];
    const accountFeatures: IdentifierArray = [SolanaSignAndSendTransaction, SolanaSignMessage, SolanaSignTransaction] as IdentifierArray;
    const accounts: WalletAccount[] = addresses.map((address) => ({
      address,
      publicKey: new Uint8Array(base58Encoder.encode(address)),
      chains: chainIdentifier ? ([chainIdentifier] as IdentifierArray) : ([] as unknown as IdentifierArray),
      features: accountFeatures,
    }));
    return new AuthSolanaWallet(provider, chainIdentifier, accounts);
  }
}
