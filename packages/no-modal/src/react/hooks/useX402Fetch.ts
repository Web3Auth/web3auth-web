import { useCallback } from "react";
import { useWalletClient } from "wagmi";

import { createEvmX402Fetch } from "../../base/x402/x402";

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

export const useX402Fetch = (): IUseX402FetchReturnValues => {
  const { data: walletClient } = useWalletClient();

  const fetchWithPayment = useCallback(
    async ({ url, options }: IUseX402FetchParams): Promise<Response> => {
      if (!walletClient?.account?.address) return null;
      const fetchWithX402Payment = createEvmX402Fetch(walletClient);
      return fetchWithX402Payment(url, options);
    },
    [walletClient]
  );

  return { fetchWithPayment };
};
