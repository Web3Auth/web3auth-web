import { For, Show } from "solid-js";

import { cn, getIcons } from "../../utils/common";

export interface Chain {
  id: string;
  name: string;
  icon?: string;
}

export interface ChainFiltersProps {
  isDark: boolean;
  isLoading: boolean;
  selectedChain: string;
  setSelectedChain: (chain: string) => void;
  chains: Chain[];
}

const ChainFilters = (props: ChainFiltersProps) => {
  return (
    <Show
      when={!props.isLoading}
      fallback={
        <div class="w3a--flex w3a--items-center w3a--justify-between w3a--gap-x-2">
          <For each={Array(props.chains.length).fill(0)}>
            {(_) => <div class="w3a--w-[100px] w3a--h-12 w3a--rounded-2xl w3a--bg-app-gray-200 dark:w3a--bg-app-gray-700 w3a--animate-pulse" />}
          </For>
        </div>
      }
    >
      <div class="w3a--flex w3a--items-center w3a--justify-between w3a--gap-x-2">
        <For each={props.chains}>
          {(chain) => (
            <button
              class={cn(
                "w3a--text-sm w3a--font-medium w3a--px-4 w3a--py-3 w3a--text-app-gray-900 dark:w3a--text-app-white w3a--rounded-2xl w3a--h-12",
                {
                  "w3a--bg-app-gray-50 dark:w3a--bg-app-gray-800": props.selectedChain === chain.id,
                }
              )}
              onClick={() => props.setSelectedChain(chain.id)}
            >
              <Show when={chain.icon} fallback={chain.name}>
                <img src={getIcons(props.isDark ? `${chain.icon}-dark` : `${chain.icon}-light`)} alt={chain.name} />
              </Show>
            </button>
          )}
        </For>
      </div>
    </Show>
  );
};

export default ChainFilters;
