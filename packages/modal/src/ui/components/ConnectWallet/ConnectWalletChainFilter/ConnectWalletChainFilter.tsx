import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import i18n from "../../../localeImport";
import { cn, getIcons } from "../../../utils";
import { ConnectWalletChainFilterProps } from "./ConnectWalletChainFilter.type";

function ConnectWalletChainFilter(props: ConnectWalletChainFilterProps) {
  const { isDark, isLoading, selectedChain, setSelectedChain, chainNamespace } = props;
  const [t] = useTranslation(undefined, { i18n });

  const chains = useMemo(() => {
    const chains = [{ id: "all", name: "modal.allChains", icon: "" }];
    for (const chain of chainNamespace) {
      chains.push({
        id: chain,
        name: chain === "eip155" ? "EVM" : chain,
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
            "w3a--flex w3a--items-center w3a--justify-center w3a--gap-x-1 w3a--text-xs w3a--font-medium w3a--px-4 w3a--py-3 w3a--text-app-gray-500 dark:w3a--text-app-gray-300 hover:w3a--bg-app-gray-200 dark:hover:w3a--bg-app-gray-700 w3a--h-12 w3a--rounded-2xl",
            {
              "w3a--bg-app-gray-100 dark:w3a--bg-app-gray-800 w3a--border w3a--border-app-gray-200 dark:w3a--border-app-gray-700 w3a--text-app-gray-900 dark:w3a--text-app-white hover:!w3a--bg-app-gray-100 dark:hover:!w3a--bg-app-gray-800":
                selectedChain === chain.id,
            }
          )}
          onClick={() => setSelectedChain(chain.id)}
        >
          {chain.icon && (
            <img src={getIcons(isDark ? `${chain.icon}-dark` : `${chain.icon}-light`)} alt={chain.name} className="w3a--size-5 w3a--object-contain" />
          )}
          <span className="first-letter:w3a--capitalize">{t(chain.name)}</span>
        </button>
      ))}
    </div>
  );
}

export default ConnectWalletChainFilter;
