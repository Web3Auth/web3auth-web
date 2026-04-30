import { CHAIN_NAMESPACES } from "@web3auth/no-modal";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useWidget } from "../../../context/WidgetContext";
import i18n from "../../../localeImport";
import { cn, getIcons } from "../../../utils";
import { ConnectWalletChainFilterProps } from "./ConnectWalletChainFilter.type";

function ConnectWalletChainFilter(props: ConnectWalletChainFilterProps) {
  const { isDark, isLoading, selectedChain, setSelectedChain } = props;
  const { uiConfig } = useWidget();
  const { chainNamespaces } = uiConfig;
  const [t] = useTranslation(undefined, { i18n });

  const chains = useMemo(() => {
    const chains = [{ id: "all", name: "modal.allChains", icon: "" }];
    for (const chain of chainNamespaces) {
      if (chain === CHAIN_NAMESPACES.EIP155 || chain === CHAIN_NAMESPACES.SOLANA) {
        chains.push({
          id: chain,
          name: chain === CHAIN_NAMESPACES.EIP155 ? "EVM" : chain,
          icon: chain === CHAIN_NAMESPACES.EIP155 ? "ethereum" : chain,
        });
      }
    }
    return chains;
  }, [chainNamespaces]);

  if (chainNamespaces.length > 1) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="wta:flex wta:items-center wta:justify-between wta:gap-x-2">
        {Array.from({ length: chains.length }).map((_, index) => (
          <div
            key={`chain-loader-${index}`}
            className="wta:h-12 wta:w-[100px] wta:animate-pulse wta:rounded-2xl wta:bg-app-gray-200 wta:dark:bg-app-gray-700"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="wta:flex wta:items-center wta:justify-items-start wta:gap-x-4">
      {chains.map((chain) => (
        <button
          type="button"
          key={chain.id}
          className={cn(
            "wta:flex wta:w-[104px] wta:items-center wta:justify-center wta:gap-x-1 wta:text-xs wta:font-medium wta:px-4 wta:py-3 wta:text-app-gray-500 wta:dark:text-app-gray-300 wta:hover:bg-app-gray-200 wta:dark:hover:bg-app-gray-700 wta:h-12 wta:rounded-2xl wta:border wta:border-transparent",
            {
              "wta:bg-app-gray-100 wta:dark:bg-app-gray-800 wta:border-app-gray-200 wta:dark:border-app-gray-700 wta:text-app-gray-900 wta:dark:text-app-white wta:hover:bg-app-gray-100! wta:dark:hover:bg-app-gray-800!":
                selectedChain === chain.id,
            }
          )}
          onClick={() => setSelectedChain(chain.id)}
        >
          {chain.icon && (
            <img src={getIcons(isDark ? `${chain.icon}-dark` : `${chain.icon}-light`)} alt={chain.name} className="wta:size-5 wta:object-contain" />
          )}
          <span className="wta:first-letter:capitalize">{t(chain.name)}</span>
        </button>
      ))}
    </div>
  );
}

export default ConnectWalletChainFilter;
