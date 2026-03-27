import Image from "../../components/Image";
import PulseLoader from "../../components/PulseLoader";

export interface LinkWalletSignVerifyProps {
  walletName: string;
  walletId: string;
  imgExtension?: string;
  stepError: boolean;
  onSimulateSuccess: () => void;
  onSimulateError: () => void;
  onRetry: () => void;
}

function LinkWalletSignVerify(props: LinkWalletSignVerifyProps) {
  const { walletName, walletId, imgExtension, stepError, onSimulateSuccess, onSimulateError, onRetry } = props;

  return (
    <div className="w3a--flex w3a--flex-1 w3a--flex-col w3a--items-center w3a--justify-center w3a--gap-y-4 w3a--px-6 w3a--py-8 w3a--text-center">
      {stepError ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" className="w3a--error-logo">
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16.001 0A8 8 0 0 1 18 10m-7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-1-9a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0V6a1 1 0 0 0-1-1"
              clipRule="evenodd"
            />
          </svg>
          <p className="w3a--text-lg w3a--font-semibold w3a--text-app-gray-900 dark:w3a--text-app-white">Verification failed</p>
          <p className="w3a--text-sm w3a--text-app-gray-400">Unable to verify signature from {walletName}. Please try again.</p>
          <button
            type="button"
            onClick={onRetry}
            className="w3a--w-full w3a--rounded-xl w3a--bg-app-gray-100 w3a--p-2 w3a--py-3 w3a--text-center w3a--text-sm w3a--text-app-gray-900 dark:w3a--bg-app-gray-800 dark:w3a--text-app-white"
          >
            Retry
          </button>
        </>
      ) : (
        <>
          <Image
            imageId={`login-${walletId}`}
            hoverImageId={`login-${walletId}`}
            fallbackImageId="wallet"
            height="60"
            width="60"
            isButton
            extension={imgExtension}
          />
          <PulseLoader />
          <p className="w3a--text-lg w3a--font-semibold w3a--text-app-gray-900 dark:w3a--text-app-white">Sign to verify</p>
          <p className="w3a--text-sm w3a--text-app-gray-400">Please sign the verification request in {walletName} to link your wallet.</p>
        </>
      )}
      {/* TODO: remove -- temporary test buttons */}
      <div className="w3a--mt-4 w3a--flex w3a--w-full w3a--gap-x-2">
        <button
          type="button"
          onClick={onSimulateSuccess}
          className="w3a--flex-1 w3a--rounded-xl w3a--bg-app-gray-50 w3a--p-2 w3a--text-xs w3a--text-app-gray-400 dark:w3a--bg-app-gray-700 dark:w3a--text-app-gray-300"
        >
          Simulate success
        </button>
        <button
          type="button"
          onClick={onSimulateError}
          className="w3a--flex-1 w3a--rounded-xl w3a--bg-app-gray-50 w3a--p-2 w3a--text-xs w3a--text-app-gray-400 dark:w3a--bg-app-gray-700 dark:w3a--text-app-gray-300"
        >
          Simulate error
        </button>
      </div>
    </div>
  );
}

export default LinkWalletSignVerify;
