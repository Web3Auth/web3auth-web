import { Connection } from "@solana/web3.js";
import { useEffect, useMemo, useState } from "react";

import { CHAIN_NAMESPACES } from "../../../base/chain/IChainInterface";
import { SolanaWallet } from "../../../providers/solana-provider";
import { useChain } from "../../hooks";
import { useWeb3Auth } from "../../hooks/useWeb3Auth";

export type IUseSolanaWallet = {
  accounts: string[] | null;
  solanaWallet: SolanaWallet | null;
  connection: Connection | null;
};

export const useSolanaWallet = (): IUseSolanaWallet => {
  const { provider, web3Auth } = useWeb3Auth();
  const { chainNamespace } = useChain();
  const [accounts, setAccounts] = useState<string[] | null>(null);

  const solanaWallet = useMemo(() => {
    if (!provider) return null;
    if (chainNamespace !== CHAIN_NAMESPACES.SOLANA) return null;
    return new SolanaWallet(provider);
  }, [provider, chainNamespace]);

  const connection = useMemo(() => {
    if (!web3Auth || !provider || chainNamespace !== CHAIN_NAMESPACES.SOLANA) return null;
    return new Connection(web3Auth.currentChain.rpcTarget);
  }, [web3Auth, provider, chainNamespace]);

  useEffect(() => {
    const init = async () => {
      if (chainNamespace !== CHAIN_NAMESPACES.SOLANA) {
        setAccounts(null);
        return;
      }
      if (!solanaWallet) return;
      const accounts = await solanaWallet.getAccounts();
      if (accounts?.length > 0) {
        setAccounts(accounts);
      }
    };

    if (solanaWallet) init();
  }, [solanaWallet, chainNamespace]);

  return { solanaWallet, accounts, connection };
};
