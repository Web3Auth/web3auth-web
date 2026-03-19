import { WalletClient } from "viem";

import { createEvmX402Fetch } from "../../base/x402/x402";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export const useX402Fetch = (walletClient: WalletClient) => {
  const { provider, chainId } = useWeb3AuthInner();

  const fetchWithPayment = async (url: string, options: RequestInit) => {
    if (!provider || !chainId) throw new Error("Provider or chainId not found");
    const fetchWithX402Payment = createEvmX402Fetch(walletClient);
    return fetchWithX402Payment(url, options);
  };

  return {
    fetchWithPayment,
  };
};
