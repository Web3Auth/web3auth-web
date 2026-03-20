export interface IUseX402FetchParams {
  /** The URL to send the payment-gated request to. */
  url: string;
  /** Optional fetch init options (method, headers, body, etc.). */
  options?: RequestInit;
}

export interface IUseX402FetchReturnValues {
  /** Trigger the payment-gated fetch. Resolves with the raw `Response` — callers are responsible for reading and parsing the body. */
  fetchWithPayment: (params: IUseX402FetchParams) => Promise<Response>;
}
