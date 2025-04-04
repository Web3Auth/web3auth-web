import { useMemo } from "react";

import { cn, getIcons } from "../../../utils";
import { ConnectWalletChainFilterProps } from "./ConnectWalletChainFilter.type";

function ConnectWalletChainFilter(props: ConnectWalletChainFilterProps) {
  const { isDark, isLoading, selectedChain, setSelectedChain, chainNamespace } = props;

  const chains = useMemo(() => {
    const chains = [{ id: "all", name: "All Chains", icon: "" }];
    for (const chain of chainNamespace) {
      chains.push({
        id: chain,
        name: chain === "eip155" ? "Ethereum" : chain,
        icon: chain === "eip155" ? "ethereum" : chain,
      });
    }
    return chains;
  }, [chainNamespace]);

  if (isLoading) {
    return (
      <div className="w3a--flex w3a--items-center w3a--justify-between w3a--gap-x-2">
        {Array.from({ length: chains.length }).map((_, index) => (
          <div
            key={`chain-loader-${index}`}
            className="w3a--h-12 w3a--w-[100px] w3a--animate-pulse w3a--rounded-2xl w3a--bg-app-gray-200 dark:w3a--bg-app-gray-700"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w3a--flex w3a--items-center w3a--justify-items-start w3a--gap-x-2">
      {chains.map((chain) => (
        <button
          type="button"
          key={chain.id}
          className={cn(
            "w3a--text-sm w3a--font-medium w3a--px-4 w3a--py-3 w3a--text-app-gray-900 dark:w3a--text-app-white w3a--rounded-2xl w3a--h-12",
            {
              "w3a--bg-app-gray-50 dark:w3a--bg-app-gray-800": selectedChain === chain.id,
            }
          )}
          onClick={() => setSelectedChain(chain.id)}
        >
          {chain.id === "all" && chain.name}
          {chain.icon && <img src={getIcons(isDark ? `${chain.icon}-dark` : `${chain.icon}-light`)} alt={chain.name} />}
        </button>
      ))}
    </div>
  );
}

export default ConnectWalletChainFilter;
