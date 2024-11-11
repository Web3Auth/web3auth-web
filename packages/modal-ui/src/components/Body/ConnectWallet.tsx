import { createSignal, For } from "solid-js"
import { WalletButton } from "../WalletButton"

export interface ConnectWalletProps {
  onBackClick?: () => void
};

const WALLET_LIST = ['Metamask', 'Ronin Wallet', 'Phantom', 'Rainbow', 'Trust Wallet', 'Coinbase Wallet', 'Uniswap', 'Metamask', 'Ronin Wallet', 'Phantom', 'Rainbow', 'Trust Wallet', 'Coinbase Wallet', 'Uniswap', 'Metamask', 'Ronin Wallet', 'Phantom', 'Rainbow', 'Trust Wallet', 'Coinbase Wallet', 'Uniswap']


const PAGES = {
  CONNECT_WALLET: 'Connect Wallet',
  SELECTED_WALLET: "Selected Wallet"
}

const ConnectWallet = ({ onBackClick }: ConnectWalletProps) => {

  const [currentPage, setCurrentPage] = createSignal(PAGES.CONNECT_WALLET);
  const [selectedWallet, setSelectedWallet] = createSignal(false);

  const handleBack = () => {
    if (!selectedWallet() && currentPage() === PAGES.CONNECT_WALLET && onBackClick) {
      onBackClick()
    }

    if (selectedWallet) {
      setCurrentPage(PAGES.CONNECT_WALLET)
      setSelectedWallet(false)
    }
  }

  return (
    <div class="w3a--flex w3a--flex-col w3a--gap-y-4 w3a--flex-1 w3a--relative">
      <div class="w3a--flex w3a--items-center w3a--justify-between">
        <figure class="w3a--w-5 w3a--h-5 w3a--rounded-full w3a--bg-app-gray-200 w3a--cursor-pointer" onClick={handleBack}></figure>
        <p class="w3a--text-base w3a--font-medium w3a--text-app-gray-900">{currentPage()}</p>
        <div class="w3a--w-5 w3a--h-5" />
      </div>

      {!selectedWallet() ? <div class="w3a--contents">
        <input placeholder="Search through wallets..." class="w3a--w-full w3a--px-4 w3a--py-2.5 w3a--border w3a--border-app-gray-300 w3a--bg-app-gray-50 placeholder:w3a--text-app-gray-400 placeholder:w3a--text-sm placeholder:w3a--font-normal w3a--rounded-full" />
        <ul class="w3a--flex w3a--flex-col w3a--gap-y-2 w3a--h-[calc(100dvh_-_240px)] w3a--overflow-y-auto">
          <For each={WALLET_LIST}>
            {(wallet) =>
              <WalletButton label={wallet} onClick={() => { setSelectedWallet(true); setCurrentPage(PAGES.SELECTED_WALLET) }} />
            }
          </For>
        </ul>
      </div> :
        <div class="w3a--contents">
          <div class="w3a--bg-app-gray-200 w3a--rounded-lg w3a--h-[320px] w3a--w-[320px] w3a--mx-auto"></div>
          <p class="w3a--text-center w3a--text-sm w3a--text-app-gray-500 w3a--font-normal">Scan with a WalletConnect-supported wallet or click the QR code to copy to your clipboard.</p>
          <div class="w3a--flex w3a--items-center w3a--justify-between w3a--w-full w3a--mt-auto w3a--bg-app-gray-50 w3a--rounded-xl w3a--p-3">
            <p class="w3a--text-sm w3a--text-app-gray-900">Don't have Trust Wallet?</p>
            <button class="w3a--appearance-none w3a--border w3a--border-app-gray-900 w3a--text-xs w3a--text-app-gray-900 w3a--rounded-full w3a--px-2 w3a--py-2">Get Wallet</button>
          </div>
        </div>
      }

      {/* <div class="absolute bottom-0 left-0 bg-app-white rounded-lg p-6 w-full flex flex-col gap-y-2 shadow-sm border border-app-gray-100">
        <div class="flex items-center gap-x-2 w-full bg-app-gray-100 px-4 py-2 rounded-full">
          <figure class="w-5 h-5 rounded-full bg-app-gray-200 cursor-pointer"></figure>
          <p class="text-sm font-medium text-app-gray-900">Install Chrome</p>
        </div>
        <div class="flex items-center gap-x-2 w-full bg-app-gray-100 px-4 py-2 rounded-full">
          <figure class="w-5 h-5 rounded-full bg-app-gray-200 cursor-pointer"></figure>
          <p class="text-sm font-medium text-app-gray-900">Install Chrome</p>
        </div>
        <div class="flex items-center gap-x-2 w-full bg-app-gray-100 px-4 py-2 rounded-full">
          <figure class="w-5 h-5 rounded-full bg-app-gray-200 cursor-pointer"></figure>
          <p class="text-sm font-medium text-app-gray-900">Install Chrome</p>
        </div>
      </div> */}
    </div>
  )
}

export default ConnectWallet