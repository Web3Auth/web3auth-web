export interface SocialLoginButtonProps {
  showIcon?: boolean;
  showText?: boolean;
}

const SocialLoginButton = ({ showIcon = true, showText = true }: SocialLoginButtonProps) => {
  return (
    <button type="button" class="appearance-none w-full border border-app-gray-400 rounded-full px-5 py-2.5 flex items-center justify-center gap-x-2 hover:shadow-md hover:translate-y-[0.5px]">
      {showIcon && <figure class="h-5 w-5 rounded-full bg-app-gray-200"></figure>}
      {showText && <p class="text-sm font-semibold">Continue with Google</p>}
    </button>
  );
};

export default SocialLoginButton;