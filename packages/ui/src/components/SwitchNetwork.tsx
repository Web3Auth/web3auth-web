import { useState } from "react";

import Image from "./Image";

interface SwitchNetworkProps {
  currentChainName: string;
  newChainName: string;
  currentChainId: string;
  newChainId: string;
  appOrigin: string;
  onSwitchNetwork: (currentChainId: string, newChainId: string) => void;
  onCancelNetwork: () => void;
}

function SwitchNetwork(props: SwitchNetworkProps) {
  const { currentChainId, newChainId, appOrigin, currentChainName, newChainName, onSwitchNetwork, onCancelNetwork } = props;
  const [showModal, setShowModal] = useState(true);

  return (
    showModal && (
      <div id="w3a-modal">
        <div className="w3a-switch-network">
          <div className="w3a-switch-network__title">This site is requesting to switch Network</div>
          <div>
            <a className="w3a-switch-network__link" href={appOrigin}>
              {appOrigin}
            </a>
          </div>
          <div className="w3a-switch-network__connect">
            <div>
              <div className="w3a-switch-network__logo">
                <Image imageId="network-default" />
              </div>
              <div>
                <div>From:</div>
                <div>{currentChainName}</div>
              </div>
            </div>
            <div>
              <div className="w3a-switch-network__connect-divider">
                <Image imageId="network-arrow" />
              </div>
            </div>
            <div>
              <div className="w3a-switch-network__logo">
                <Image imageId="network-default" />
              </div>
              <div>
                <div>To:</div>
                <div>{newChainName}</div>
              </div>
            </div>
          </div>
          <div className="w3a-switch-network__buttons">
            <button
              type="button"
              className="w3a-button"
              onClick={() => {
                setShowModal(false);
                onCancelNetwork();
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="w3a-button w3a-button--primary"
              onClick={() => {
                setShowModal(false);
                onSwitchNetwork(currentChainId, newChainId);
              }}
            >
              Proceed
            </button>
          </div>
        </div>
      </div>
    )
  );
}

export default SwitchNetwork;
