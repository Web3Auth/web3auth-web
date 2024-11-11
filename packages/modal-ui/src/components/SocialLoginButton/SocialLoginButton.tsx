export interface SocialLoginButtonProps {
  showIcon?: boolean;
  showText?: boolean;
}

const SocialLoginButton = ({ showIcon = true, showText = true }: SocialLoginButtonProps) => {
  return (
    <button type="button" class="w3a--appearance-none w3a--w-full w3a--border w3a--border-app-gray-400 w3a--rounded-full w3a--px-5 w3a--py-2.5 w3a--flex w3a--items-center w3a--justify-center w3a--gap-x-2 hover:w3a--shadow-md hover:w3a--translate-y-[0.5px]">
      {showIcon && <figure class="w3a--h-5 w3a--w-5 w3a--rounded-full w3a--bg-app-gray-200"></figure>}
      {showText && <p class="w3a--text-sm w3a--font-semibold">Continue with Google</p>}
    </button>
  );
};

export default SocialLoginButton;