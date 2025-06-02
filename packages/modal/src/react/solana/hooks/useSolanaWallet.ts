import { Connection } from "@solana/web3.js";
import { CHAIN_NAMESPACES, SolanaWallet } from "@web3auth/no-modal";
import { useEffect, useMemo, useState } from "react";

import { useWeb3Auth } from "../../hooks/useWeb3Auth";

export type IUseSolanaWallet = {
  accounts: string[] | null;
  solanaWallet: SolanaWallet | null;
  connection: Connection | null;
};

export const useSolanaWallet = (): IUseSolanaWallet => {
  const { provider, web3Auth } = useWeb3Auth();
  const [accounts, setAccounts] = useState<string[] | null>(null);

  const solanaWallet = useMemo(() => {
    if (!provider) return null;
    return new SolanaWallet(provider);
  }, [provider]);

  const connection = useMemo(() => {
    if (!web3Auth || !provider) return null;
    return new Connection(web3Auth.currentChain.rpcTarget);
  }, [web3Auth, provider]);

  useEffect(() => {
    const init = async () => {
      if (!web3Auth?.currentChain?.chainNamespace || web3Auth.currentChain.chainNamespace !== CHAIN_NAMESPACES.SOLANA) {
        return;
      }
      if (!solanaWallet) return;
      const accounts = await solanaWallet.getAccounts();
      if (accounts?.length > 0) {
        setAccounts(accounts);
      }
    };

    if (solanaWallet) init();
  }, [solanaWallet, web3Auth]);

  return { solanaWallet, accounts, connection };
};
