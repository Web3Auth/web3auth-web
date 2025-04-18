import { SolanaWallet } from "@web3auth/no-modal";
import { useEffect, useMemo, useState } from "react";

import { useWeb3Auth } from "../../hooks/useWeb3Auth";

export type IUseSolanaWallet = {
  accounts: string[] | null;
  solanaWallet: SolanaWallet | null;
};

export const useSolanaWallet = (): IUseSolanaWallet => {
  const { provider } = useWeb3Auth();
  const [accounts, setAccounts] = useState<string[] | null>(null);

  const solanaWallet = useMemo(() => {
    if (!provider) return null;
    return new SolanaWallet(provider);
  }, [provider]);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!solanaWallet) return;
      const accounts = await solanaWallet.requestAccounts();
      if (accounts?.length > 0) {
        setAccounts(accounts);
      }
    };

    if (solanaWallet) fetchAccounts();
  }, [solanaWallet]);

  return { solanaWallet, accounts };
};
