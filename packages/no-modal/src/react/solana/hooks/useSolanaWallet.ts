import { Connection } from "@solana/web3.js";
import { useEffect, useMemo, useState } from "react";

import { CHAIN_NAMESPACES } from "../../../base/chain/IChainInterface";
import { SolanaWallet } from "../../../providers/solana-provider";
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
      if (!solanaWallet) return;
      if (!web3Auth?.currentChain?.chainNamespace || web3Auth.currentChain.chainNamespace !== CHAIN_NAMESPACES.SOLANA) {
        return;
      }
      const accounts = await solanaWallet.requestAccounts();
      if (accounts?.length > 0) {
        setAccounts(accounts);
      }
    };

    if (solanaWallet) init();
  }, [solanaWallet]);

  return { solanaWallet, accounts, connection };
};
