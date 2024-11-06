export interface WalletButtonProps {
  label: string;
  onClick?: () => void
};

const WalletButton = ({ label, ...props }: WalletButtonProps) => {
  return (
    <button class="w-full flex items-center justify-between p-4 rounded-xl bg-app-gray-100 hover:shadow-md hover:translate-y-[0.5px] border border-app-gray-100 hover:border-app-gray-200" {...props}>
      <div class="flex items-center gap-x-2">
        <figure class="w-5 h-5 rounded-full bg-app-gray-300"></figure>
        <p class="text-sm font-medium text-app-gray-900">{label}</p>
      </div>

      <figure class="w-5 h-5 rounded-full bg-app-gray-300"></figure>
    </button>
  )
}

export default WalletButton