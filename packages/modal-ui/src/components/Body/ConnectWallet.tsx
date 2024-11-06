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
    <div class="flex flex-col gap-y-4 flex-1 relative">
      <div class="flex items-center justify-between">
        <figure class="w-5 h-5 rounded-full bg-app-gray-200 cursor-pointer" onClick={handleBack}></figure>
        <p class="text-base font-medium text-app-gray-900">{currentPage()}</p>
        <div class="w-5 h-5" />
      </div>

      {!selectedWallet() ? <div class="contents">
        <input placeholder="Search through wallets..." class="w-full px-4 py-2.5 border border-app-gray-300 bg-app-gray-50 placeholder:text-app-gray-400 placeholder:text-sm placeholder:font-normal rounded-full" />
        <ul class="flex flex-col gap-y-2 h-[calc(100dvh_-_240px)] overflow-y-auto">
          <For each={WALLET_LIST}>
            {(wallet) =>
              <WalletButton label={wallet} onClick={() => { setSelectedWallet(true); setCurrentPage(PAGES.SELECTED_WALLET) }} />
            }
          </For>
        </ul>
      </div> :
        <div class="contents">
          <div class="bg-app-gray-200 rounded-lg h-[320px] w-[320px] mx-auto"></div>
          <p class="text-center text-sm text-app-gray-500 font-normal">Scan with a WalletConnect-supported wallet or click the QR code to copy to your clipboard.</p>
          <div class="flex items-center justify-between w-full mt-auto bg-app-gray-50 rounded-xl p-3">
            <p class="text-sm text-app-gray-900">Don't have Trust Wallet?</p>
            <button class="appearance-none border border-app-gray-900 text-xs text-app-gray-900 rounded-full px-2 py-2">Get Wallet</button>
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