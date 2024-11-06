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
    <div class="flex flex-col gap-y-4 h-full">
      <div class="flex flex-col items-start gap-y-1">
        <p class="text-xl font-bold text-app-gray-900 dark:text-app-white">Sign in</p>
        <p class="text-sm font-normal text-app-gray-500 dark:text-app-gray-400">Your Web3Auth wallet with one click</p>
      </div>

      <SocialLoginList />


      <form class="flex flex-col gap-y-4 mt-auto">
        <div class="flex flex-col gap-y-2">
          <label class="text-sm font-semibold text-app-gray-900 text-start">Email or Phone</label>
          <input placeholder="E.g. +00-123455/name@example.com" class="px-4 py-2.5 border border-app-gray-300 bg-app-gray-50 placeholder:text-app-gray-400 placeholder:text-sm placeholder:font-normal rounded-full" />
        </div>
        <button class="w-full px-5 py-3 rounded-full bg-app-gray-100 disabled:text-app-gray-400 text-app-gray-900 text-sm font-medium">Continue with Email</button>
        <div class="flex flex-col gap-y-2">
          <label class="text-sm font-semibold text-app-gray-900 text-start">External Wallet</label>
          <button class="w-full px-5 py-3 rounded-full bg-app-gray-100 disabled:text-app-gray-400 text-app-gray-900 text-sm font-medium" onClick={handleConnectWallet}>Connect with Wallet</button>
        </div>
      </form>
    </div>
  )
}

export default Login;