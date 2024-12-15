import { ADAPTER_STATUS } from "@web3auth/base";
import { createEffect, createMemo, Show } from "solid-js";

import { MODAL_STATUS, ModalStatusType } from "../../interfaces";
import { Image } from "../Image";

export interface LoaderProps {
  message?: string;
  appLogo?: string;
  adapter: string;
  adapterName: string;
  modalStatus: ModalStatusType;
  onClose: () => void;
}

const Loader = (props: LoaderProps) => {
  const providerIcon = createMemo(() =>
    props.adapter === "twitter" ? <Image imageId="login-x-dark" /> : <Image imageId={`login-${props.adapter}`} height="40" width="40" />
  );

  createEffect(() => {
    if (props.modalStatus === MODAL_STATUS.CONNECTED) {
      setTimeout(() => {
        props.onClose();
      }, 3000);
    }
  });

  return (
    <div class="w3a--h-full w3a--flex w3a--flex-col w3a--flex-1 w3a--items-center w3a--justify-center w3a--gap-y-4">
      <Show when={props.modalStatus === ADAPTER_STATUS.CONNECTING}>
        <div class="w3a--h-full w3a--flex w3a--flex-col w3a--flex-1 w3a--items-center w3a--justify-center w3a--gap-y-4">
          <div class="w3a--flex w3a--items-center w3a--justify-center w3a--gap-x-6">
            <figure class="w3a--loader-logo-size w3a--overflow-hidden w3a--flex w3a--items-center w3a--justify-center">
              <img src={props.appLogo} alt="" class="w3a--h-full w3a--w-full w3a--object-contain" />
            </figure>

            <div class="w3a--flex w3a--items-center w3a--justify-center w3a--gap-x-2">
              <div class="w3a--animate-circle" />
              <div class="w3a--animate-circle" />
              <div class="w3a--animate-circle" />
              <div class="w3a--animate-circle" />
            </div>

            {providerIcon()}
          </div>
          <div class="w3a--flex w3a--flex-col w3a--gap-y-1">
            <div class="w3a--text-sm w3a--text-app-gray-500 dark:w3a--text-app-gray-400 w3a--text-center">{`modal.adapter-loader.message1 ${props.adapterName}`}</div>
            <div class="w3a--text-sm w3a--text-app-gray-500 dark:w3a--text-app-gray-400 w3a--text-center">{`modal.adapter-loader.message2 ${props.adapterName}`}</div>
          </div>
        </div>
      </Show>

      <Show when={props.modalStatus === ADAPTER_STATUS.CONNECTED}>
        <div class="w3a--flex w3a--flex-col w3a--items-center">
          {/* <Icon iconName="connected" /> */}
          <p>Connected</p>
          <div class="w3ajs-modal-loader__message w3a-spinner-message w3a--mt-4">{props.message}</div>
        </div>
      </Show>

      <Show when={props.modalStatus === ADAPTER_STATUS.ERRORED}>
        <p>Errored</p>
        <div class="w3ajs-modal-loader__message w3a-spinner-message w3a-spinner-message--error">{props.message}</div>
      </Show>
    </div>
  );
};

export default Loader;
