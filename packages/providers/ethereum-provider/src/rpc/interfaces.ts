import type { JRPCRequest } from "@web3auth/auth";
import type { TransactionLike, TypedDataDomain, TypedDataField } from "ethers";
export interface IAccountHandlers {
  updatePrivatekey: (params: { privateKey: string }) => Promise<void>;
}

export interface AddEthereumChainParameter {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string; // 2-6 characters long
    decimals: 18;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[];
}

export interface IChainSwitchHandlers {
  addChain: (params: AddEthereumChainParameter) => Promise<void>;
  switchChain: (params: { chainId: string }) => Promise<void>;
}

export type TransactionParams<A = string> = TransactionLike<A> & { input?: string };

export interface MessageParams<T> {
  from: string;
  data: T;
}

export interface BaseRequestParams {
  /**
   * Unique id for each request
   */
  id?: string;
  /**
   * Address to send this transaction from.
   */
  from: string;

  /**
   * Domain requested from
   */
  origin?: string;
}

export type SignTypedDataMessageV4 = {
  types: Record<string, TypedDataField[]>;
  domain: TypedDataDomain;
  message: Record<string, unknown>;
};

export interface TypedMessageParams extends BaseRequestParams {
  data: string | SignTypedDataMessageV4;
}

export interface WalletMiddlewareOptions {
  getAccounts: (req: JRPCRequest<unknown>) => Promise<string[]>;
  getPrivateKey: (req: JRPCRequest<unknown>) => Promise<string>;
  processEthSignMessage?: (msgParams: MessageParams<string>, req: JRPCRequest<unknown>) => Promise<string>;
  processPersonalMessage?: (msgParams: MessageParams<string>, req: JRPCRequest<unknown>) => Promise<string>;
  processTransaction?: (txParams: TransactionParams, req: JRPCRequest<unknown>) => Promise<string>;
  processSignTransaction?: (txParams: TransactionParams, req: JRPCRequest<unknown>) => Promise<string>;
  processTypedMessageV4?: (msgParams: TypedMessageParams, req: JRPCRequest<unknown>) => Promise<string>;
}

export type IProviderHandlers = WalletMiddlewareOptions;
