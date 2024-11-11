import SocialLoginList from "../SocialLoginList";

export interface LoginProps {
  onExternalWalletClick?: () => void;
};

const Login = ({ onExternalWalletClick }: LoginProps) => {

  const handleConnectWallet = (e: MouseEvent) => {
    e.preventDefault();
    if (onExternalWalletClick) onExternalWalletClick()
  }
  return (
    <div class="w3a--flex w3a--flex-col w3a--gap-y-4 w3a--h-full">
      <div class="w3a--flex w3a--flex-col w3a--items-start w3a--gap-y-1">
        <p class="w3a--text-xl w3a--font-bold w3a--text-app-gray-900 dark:w3a--text-app-white">Sign in</p>
        <p class="w3a--text-sm w3a--font-normal w3a--text-app-gray-500 dark:w3a--text-app-gray-400">Your Web3Auth wallet with one click</p>
      </div>

      <SocialLoginList />


      <form class="w3a--flex w3a--flex-col w3a--gap-y-4 w3a--mt-auto">
        <div class="w3a--flex w3a--flex-col w3a--gap-y-2">
          <label class="w3a--text-sm w3a--font-semibold w3a--text-app-gray-900 w3a--text-start">Email or Phone</label>
          <input placeholder="E.g. +00-123455/name@example.com" class="w3a--px-4 w3a--py-2.5 w3a--border w3a--border-app-gray-300 w3a--bg-app-gray-50 placeholder:w3a--text-app-gray-400 placeholder:w3a--text-sm placeholder:w3a--font-normal w3a--rounded-full" />
        </div>
        <button class="w3a--w-full w3a--px-5 w3a--py-3 w3a--rounded-full w3a--bg-app-gray-100 disabled:w3a--text-app-gray-400 w3a--text-app-gray-900 w3a--text-sm w3a--font-medium">Continue with Email</button>
        <div class="w3a--flex w3a--flex-col w3a--gap-y-2">
          <label class="w3a--text-sm w3a--font-semibold w3a--text-app-gray-900 w3a--text-start">External Wallet</label>
          <button class="w3a--w-full w3a--px-5 w3a--py-3 w3a--rounded-full w3a--bg-app-gray-100 disabled:w3a--text-app-gray-400 w3a--text-app-gray-900 w3a--text-sm w3a--font-medium" onClick={handleConnectWallet}>Connect with Wallet</button>
        </div>
      </form>
    </div>
  )
}

export default Login;