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
  type StandardEventsChangeProperties,
  type StandardEventsFeature,
  type StandardEventsListeners,
} from "@wallet-standard/features";
import { SOLANA_METHOD_TYPES } from "@web3auth/ws-embed";

import {
  type CustomChainConfig,
  getSolanaChainByChainConfig,
  type IProvider,
  SOLANA_CAIP_CHAIN_MAP,
  WalletLoginError,
  WEB3AUTH_ICON,
} from "../../base";

const base58Encoder = getBase58Encoder();
const base64Decoder = getBase64Decoder();
const base64Encoder = getBase64Encoder();
const transactionDecoder = getTransactionDecoder();

const ACCOUNT_FEATURES: IdentifierArray = [SolanaSignAndSendTransaction, SolanaSignMessage, SolanaSignTransaction] as IdentifierArray;

type AuthSolanaFeatures = StandardConnectFeature &
  StandardDisconnectFeature &
  StandardEventsFeature &
  SolanaSignAndSendTransactionFeature &
  SolanaSignMessageFeature &
  SolanaSignTransactionFeature;

function solanaWalletChainsFromConfigs(solanaChainConfigs: CustomChainConfig[]): IdentifierArray {
  const ids = solanaChainConfigs.map(getSolanaChainByChainConfig).filter((id): id is NonNullable<typeof id> => id != null);
  const unique = [...new Set(ids)];
  return unique as IdentifierArray;
}

const SOLANA_PROVIDER_HEX_CHAIN_IDS = new Set(Object.keys(SOLANA_CAIP_CHAIN_MAP).map((id) => id.toLowerCase()));

/**
 * AuthSolanaWallet implements the Wallet Standard interface, wrapping a JRPC provider.
 * Used by AuthConnector so consumers get a standards-compliant Wallet from `connection.solanaWallet`.
 *
 * {@link Wallet.accounts} is synchronous in the Wallet Standard; it returns `[]` until accounts have been loaded
 * (`null` internally). The first async operation ({@link StandardConnect}, sign, etc.) calls `ensureAccountsLoaded`, which
 * requires {@link IProvider.chainId} to be a configured Solana network (see {@link SOLANA_CAIP_CHAIN_MAP}) before {@link SOLANA_METHOD_TYPES.GET_ACCOUNTS}.
 */
export class AuthSolanaWallet implements Wallet {
  readonly version: WalletVersion = "1.0.0";

  readonly name = "Web3Auth";

  readonly icon: WalletIcon = WEB3AUTH_ICON;

  readonly chains: IdentifierArray;

  readonly features: AuthSolanaFeatures;

  private _accounts: WalletAccount[] | null = null;

  private _ensureAccountsPromise: Promise<void> | null = null;

  private readonly _listeners: { [E in keyof StandardEventsListeners]?: Set<StandardEventsListeners[E]> } = {};

  /**
   * @param solanaChainConfigs - All configured Solana {@link CustomChainConfig} entries (same namespace).
   */
  constructor(
    private readonly _provider: IProvider,
    solanaChainConfigs: CustomChainConfig[]
  ) {
    this.chains = solanaWalletChainsFromConfigs(solanaChainConfigs);

    this.features = {
      [StandardConnect]: {
        version: "1.0.0",
        connect: async () => {
          await this.ensureAccountsLoaded();
          return { accounts: this.accounts };
        },
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
          await this.ensureAccountsLoaded();
          return Promise.all(
            inputs.map(async (input) => {
              const base64Tx = base64Decoder.decode(input.transaction);
              const signature = await this._provider.request<{ message: string }, string>({
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
          await this.ensureAccountsLoaded();
          return Promise.all(
            inputs.map(async (input) => {
              const message = new TextDecoder().decode(input.message);
              const signature = await this._provider.request<{ data: string; from: string }, string>({
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
          await this.ensureAccountsLoaded();
          return Promise.all(
            inputs.map(async (input) => {
              const base64Tx = base64Decoder.decode(input.transaction);
              const signatureBase58 = await this._provider.request<{ message: string }, string>({
                method: SOLANA_METHOD_TYPES.SIGN_TRANSACTION,
                params: { message: base64Tx },
              });
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

  /**
   * Wallet Standard requires a synchronous getter; RPC runs on first async wallet operation instead.
   */
  get accounts(): readonly WalletAccount[] {
    return this._accounts ?? [];
  }

  /** Throws if the embed is not on Solana; otherwise loads accounts once via {@link SOLANA_METHOD_TYPES.GET_ACCOUNTS}. */
  private async ensureAccountsLoaded(): Promise<void> {
    // assert solana chain
    const chainId = this._provider.chainId;
    if (!SOLANA_PROVIDER_HEX_CHAIN_IDS.has(chainId.toLowerCase()))
      throw WalletLoginError.unsupportedOperation(
        `Solana wallet operations require the embedded provider to be on a Solana network (current chainId: ${chainId}). Switch chain first.`
      );

    if (this._accounts !== null) return;
    if (!this._ensureAccountsPromise) {
      this._ensureAccountsPromise = this.loadAccountsFromProvider().finally(() => {
        this._ensureAccountsPromise = null;
      });
    }
    await this._ensureAccountsPromise;
  }

  private async loadAccountsFromProvider(): Promise<void> {
    const addresses = (await this._provider.request<never, string[]>({ method: SOLANA_METHOD_TYPES.GET_ACCOUNTS })) ?? [];
    const accountChains = this.chains;
    this._accounts = addresses.map((address) => ({
      address,
      publicKey: new Uint8Array(base58Encoder.encode(address)),
      chains: accountChains.length ? accountChains : ([] as unknown as IdentifierArray),
      features: ACCOUNT_FEATURES,
    }));
    this.emitChange({ accounts: this.accounts });
  }

  private emitChange(properties: StandardEventsChangeProperties): void {
    const listeners = this._listeners.change;
    if (!listeners) return;
    listeners.forEach((listener) => {
      listener(properties);
    });
  }
}
