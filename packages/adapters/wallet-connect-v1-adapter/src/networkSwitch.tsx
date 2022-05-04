import type { WalletConnectProvider } from "@web3auth/ethereum-provider";
import { render } from "react-dom";

import AddNetwork from "./components/AddNetwork";
import SwitchNetwork from "./components/SwitchNetwork";

function createWrapper(): HTMLElement {
  const wrapper = document.createElement("section");
  wrapper.setAttribute("id", "w3a-network-container");
  document.body.appendChild(wrapper);
  return wrapper;
}

class NetworkSwitch {
  private wcProvider: WalletConnectProvider;

  constructor(wcProvider: WalletConnectProvider) {
    this.wcProvider = wcProvider;
  }

  public async addNetwork(chainId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const addNetworkCallback = async (): Promise<void> => {
        await this.wcProvider.addChain({ chainId });
        return resolve();
      };
      const cancelCallback = (): void => {
        return reject(new Error("User cancelled request for adding new network"));
      };
      render(<AddNetwork onAddNetwork={addNetworkCallback} onCancelNetwork={cancelCallback} chainId={chainId} />, createWrapper());
    });
  }

  public async switchNetwork(currentChainId: string, newChainId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const switchNetworkCallback = async (): Promise<void> => {
        await this.wcProvider.switchChain({ chainId: newChainId, lookup: false });
        return resolve();
      };
      const cancelCallback = (): void => {
        return reject(new Error("User cancelled request for adding new network"));
      };
      render(
        <SwitchNetwork
          onSwitchNetwork={switchNetworkCallback}
          onCancelNetwork={cancelCallback}
          currentChainId={currentChainId}
          newChainId={newChainId}
        ></SwitchNetwork>,
        createWrapper()
      );
    });
  }

  public cancel(): void {}
}

export { NetworkSwitch };
