/* eslint-disable class-methods-use-this */
import "../css/network.css";

import { CustomChainConfig } from "@web3auth/base";
import { render } from "react-dom";

import AddNetwork from "./components/AddNetwork";
import SwitchNetwork from "./components/SwitchNetwork";
import { BaseNetworkSwitch } from "./interfaces";

function createWrapper(): HTMLElement {
  const wrapper = document.createElement("section");
  wrapper.setAttribute("id", "w3a-network-container");
  document.body.appendChild(wrapper);
  return wrapper;
}

export class NetworkSwitch extends BaseNetworkSwitch {
  public async addNetwork(params: { chainConfig: CustomChainConfig; appOrigin: string }): Promise<boolean> {
    const { chainConfig, appOrigin } = params;
    return new Promise((resolve, reject) => {
      const addNetworkCallback = async (): Promise<void> => {
        return resolve(true);
      };
      const cancelCallback = (): void => {
        return reject(new Error("User cancelled request for adding new network"));
      };
      render(
        <AddNetwork
          appOrigin={appOrigin}
          chainName={chainConfig.displayName}
          onAddNetwork={addNetworkCallback}
          onCancelNetwork={cancelCallback}
          chainId={chainConfig.chainId}
        />,
        createWrapper()
      );
    });
  }

  public async switchNetwork(params: {
    currentChainId: string;
    newChainId: string;
    appOrigin: string;
    currentChainName: string;
    newChainName: string;
  }): Promise<boolean> {
    const { currentChainId, newChainId, appOrigin, currentChainName, newChainName } = params;

    return new Promise((resolve, reject) => {
      const switchNetworkCallback = async (): Promise<void> => {
        return resolve(true);
      };
      const cancelCallback = (): void => {
        return reject(new Error("User cancelled request for adding new network"));
      };
      render(
        <SwitchNetwork
          appOrigin={appOrigin}
          currentChainName={currentChainName}
          newChainName={newChainName}
          onSwitchNetwork={switchNetworkCallback}
          onCancelNetwork={cancelCallback}
          currentChainId={currentChainId}
          newChainId={newChainId}
        />,
        createWrapper()
      );
    });
  }

  public cancel(): void {}
}
