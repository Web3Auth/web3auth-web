import { useState } from "react";

import Image from "./Image";

interface AddNetworkProps {
  chainId: string;
  chainName: string;
  appOrigin: string;
  onAddNetwork: (chainId: string) => void;
  onCancelNetwork: () => void;
}

function AddNetwork(props: AddNetworkProps) {
  const { chainName, chainId, appOrigin, onAddNetwork, onCancelNetwork } = props;
  const [showModal, setShowModal] = useState(true);
  return (
    showModal && (
      <div id="w3a-modal">
        <div className="w3a-switch-network">
          <div className="w3a-switch-network__title">This site is requesting to add Network</div>
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
                <div>{chainName}</div>
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
                onAddNetwork(chainId);
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

export default AddNetwork;
