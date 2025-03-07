import { Show } from "solid-js";
import { MaskType, QRCodeCanvas } from "solid-qr-code";

import { ExternalButton } from "../../interfaces";
import { t } from "../../localeImport";
import { Image } from "../Image";

export interface ConnectWalletQrCodeProps {
  walletConnectUri: string;
  isDark: boolean;
  selectedButton: ExternalButton;
  setBodyState: (state: { showWalletDetails: boolean; walletDetails: ExternalButton }) => void;
  bodyState: { showWalletDetails: boolean; walletDetails: ExternalButton };
}

const ConnectWalletQrCode = (props: ConnectWalletQrCodeProps) => {
  return (
    <div class="w3a--contents">
      <Show
        when={props.walletConnectUri}
        fallback={
          <div class="w3a--bg-app-gray-200 dark:w3a--bg-app-gray-700 w3a--animate-pulse w3a--rounded-lg w3a--h-[300px] w3a--w-[300px] w3a--mx-auto w3a--p-2 w3a--flex w3a--items-center w3a--justify-center">
            <Image
              imageId={`login-${props.selectedButton.name}`}
              hoverImageId={`login-${props.selectedButton.name}`}
              fallbackImageId="wallet"
              height="30"
              width="30"
              isButton
              extension={props.selectedButton.imgExtension}
            />
          </div>
        }
      >
        <div class="w3a--flex w3a--flex-col w3a--gap-y-4 w3a--items-center w3a--justify-center w3a--border w3a--border-app-gray-200 dark:w3a--border-app-gray-700 w3a--rounded-2xl w3a--p-4">
          <div class="w3a--relative w3a--rounded-2xl w3a--h-[300px] w3a--w-[300px] w3a--flex w3a--items-center w3a--justify-center">
            <QRCodeCanvas
              value={props.walletConnectUri || ""}
              level="low"
              backgroundColor="transparent"
              backgroundAlpha={0}
              foregroundColor={props.isDark ? "#ffffff" : "#000000"}
              foregroundAlpha={1}
              width={300}
              height={300}
              x={0}
              y={0}
              maskType={MaskType.FLOWER_IN_SQAURE}
            />
            <div class="w3a--absolute w3a--top-[43%] w3a--left-[43%] w3a--transform -translate-y-1/2 w3a--w-10 w3a--h-10 w3a--bg-app-white w3a--rounded-full w3a--flex w3a--items-center w3a--justify-center">
              <Image
                imageId={`login-${props.selectedButton.name}`}
                hoverImageId={`login-${props.selectedButton.name}`}
                fallbackImageId="wallet"
                height="20"
                width="20"
                isButton
                extension={props.selectedButton.imgExtension}
              />
            </div>
          </div>
          <p class="w3a--text-center w3a--text-sm w3a--text-app-gray-500 dark:w3a--text-app-gray-300 w3a--font-normal">
            {t("modal.external.walletconnect-copy")}
          </p>
        </div>
      </Show>

      <div
        class="w3a--flex w3a--items-center w3a--justify-between w3a--w-full w3a--text-app-gray-900 w3a--bg-app-gray-50 
      dark:w3a--bg-app-gray-800 dark:w3a--text-app-white w3a--rounded-2xl w3a--px-4 w3a--py-2"
      >
        <p class="w3a--text-sm w3a--text-app-gray-900 dark:w3a--text-app-white">
          {t("modal.external.dont-have")} <span>{props.selectedButton?.displayName}</span>?
        </p>
        <button
          class="w3a--appearance-none w3a--border w3a--border-app-gray-400 w3a--text-sm w3a--font-medium w3a--text-app-gray-400 hover:w3a--bg-app-white dark:hover:w3a--bg-app-gray-700 dark:w3a--text-app-gray-300 dark:w3a--border-app-gray-300 w3a--rounded-full w3a--px-3 w3a--py-2 hover:w3a--shadow-2xl"
          onClick={() => {
            props.setBodyState({
              ...props.bodyState,
              showWalletDetails: true,
              walletDetails: props.selectedButton,
            });
          }}
        >
          {t("modal.external.get-wallet")}
        </button>
      </div>
    </div>
  );
};

export default ConnectWalletQrCode;
