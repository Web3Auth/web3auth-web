export interface WalletButtonProps {
  label: string;
  onClick?: () => void
};

const WalletButton = ({ label, ...props }: WalletButtonProps) => {
  return (
    <button class="w3a--w-full w3a--flex w3a--items-center w3a--justify-between w3a--p-4 w3a--rounded-xl w3a--bg-app-gray-100 hover:w3a--shadow-md hover:w3a--translate-y-[0.5px] w3a--border w3a--border-app-gray-100 hover:w3a--border-app-gray-200" {...props}>
      <div class="w3a--flex w3a--items-center w3a--gap-x-2">
        <figure class="w3a--w-5 w3a--h-5 w3a--rounded-full w3a--bg-app-gray-300"></figure>
        <p class="w3a--text-sm w3a--font-medium w3a--text-app-gray-900">{label}</p>
      </div>

      <figure class="w3a--w-5 w3a--h-5 w3a--rounded-full w3a--bg-app-gray-300"></figure>
    </button>
  )
}

export default WalletButton