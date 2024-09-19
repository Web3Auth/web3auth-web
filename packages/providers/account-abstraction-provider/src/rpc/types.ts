import { TransactionLike, TypedDataDomain, TypedDataField } from "ethers";

export interface MessageParams<T> {
  from: string;
  data: T;
}

export type TransactionParams<A = string> = TransactionLike<A> & { input?: string };

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
