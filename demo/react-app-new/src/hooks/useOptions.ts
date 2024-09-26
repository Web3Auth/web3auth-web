import { useAppContext } from '@/context';
import { useState, useEffect } from 'react';
import { CHAIN_NAMESPACES, ChainNamespaceType, CustomChainConfig, WEB3AUTH_NETWORK, WEB3AUTH_NETWORK_TYPE } from "@web3auth/base";

import { networkOptions, chainNamespaceOptions, chainConfigs, loginProviderOptions, languageOptions } from '../config'
import { log } from 'console';

interface Option {
  label: string;
  value: string;
}

const useOptions = () => {
  const { chainNamespace, chain } = useAppContext();

  const [chainOptions, setChainOptions] = useState<Option[]>([]);
  const [adapterOptions, setAdapterOptions] = useState<Option[]>([]);

  useEffect(() => {
    if(!chainConfigs[chainNamespace as ChainNamespaceType]?.length) return;
    setChainOptions( chainConfigs[chainNamespace as ChainNamespaceType].map((x) => ({
      label: `${x.chainId} ${x.tickerName}`,
      value: x.chainId,
    })) );
    setAdapterOptions(
      chainNamespace === CHAIN_NAMESPACES.EIP155 
        ?
          [
            { label: "coinbase-adapter", value: "coinbase" },
            { label: "torus-evm-adapter", value: "torus-evm" },
            { label: "wallet-connect-v2-adapter", value: "wallet-connect-v2" },
            { label: "injected-adapters", value: "injected-evm" },
          ]
        :
          [
            { label: "torus-solana-adapter", value: "torus-solana" },
            { label: "injected-adapters", value: "injected-solana" },
          ]
  )
  }, [chainNamespace, chain]);

  return {
    networkOptions,
    chainNamespaceOptions,
    chainOptions,
    adapterOptions,
    loginProviderOptions,
    languageOptions,
  };
};

export default useOptions;