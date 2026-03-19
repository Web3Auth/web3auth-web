import { useCallback, useMemo } from "react";
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
  wrapFetchWithPayment: (params: IUseX402FetchParams) => Promise<Response>;
}

export const useX402Fetch = (): IUseX402FetchReturnValues => {
  const { data: walletClient } = useWalletClient();

  const x402Fetch = useMemo(() => {
    if (!walletClient?.account?.address) return null;
    return createEvmX402Fetch(walletClient);
  }, [walletClient]);

  const wrapFetchWithPayment = useCallback(
    async ({ url, options }: IUseX402FetchParams): Promise<Response> => {
      if (!x402Fetch) {
        throw new Error("Connect a wallet before making a request.");
      }

      return x402Fetch(url, options);
    },
    [x402Fetch]
  );

  return { wrapFetchWithPayment };
};
