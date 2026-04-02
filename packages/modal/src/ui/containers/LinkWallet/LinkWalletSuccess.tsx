import Image from "../../components/Image";

export interface LinkWalletSuccessProps {
  walletName: string;
  walletId: string;
  imgExtension?: string;
}

function LinkWalletSuccess(props: LinkWalletSuccessProps) {
  const { walletName, walletId, imgExtension } = props;

  return (
    <div className="w3a--flex w3a--flex-1 w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-4 w3a--px-6 w3a--py-8 w3a--text-center">
      <Image
        imageId={`login-${walletId}`}
        hoverImageId={`login-${walletId}`}
        fallbackImageId="wallet"
        height="60"
        width="60"
        isButton
        extension={imgExtension}
      />
      <p className="w3a--text-lg w3a--font-semibold w3a--text-app-gray-900 dark:w3a--text-app-white">Wallet linked successfully</p>
      <p className="w3a--text-sm w3a--text-app-gray-400">{walletName} has been linked to your account.</p>
    </div>
  );
}

export default LinkWalletSuccess;
