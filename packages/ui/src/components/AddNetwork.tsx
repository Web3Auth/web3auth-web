import { CustomChainConfig } from "@web3auth/base";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getNetworkIconId } from "../utils";
import Image from "./Image";

interface AddNetworkProps {
  chainConfig: CustomChainConfig;
  appOrigin: string;
  onAddNetwork: (chainId: string) => void;
  onCancelNetwork: () => void;
}

function AddNetwork(props: AddNetworkProps) {
  const { chainConfig, appOrigin, onAddNetwork, onCancelNetwork } = props;
  const [showModal, setShowModal] = useState(true);
  const [networkIconId, setNetworkIconId] = useState("network-default");

  const [t] = useTranslation();

  useEffect(() => {
    getNetworkIconId(chainConfig.ticker)
      .then((id) => {
        return setNetworkIconId(id);
      })
      .catch(() => {});
  }, [chainConfig.ticker]);

  return (
    showModal && (
      <div id="w3a-modal-network">
        <div className="w3a-switch-network">
          <div className="w3a-switch-network__title">{t("modal.network.add-request")}</div>
          <div>
            <a className="w3a-switch-network__link" href={appOrigin}>
              {appOrigin}
            </a>
          </div>
          <div className="w3a-switch-network__connect">
            <div>
              <div className="w3a-switch-network__logo">
                <Image imageId={networkIconId} />
              </div>
              <div>
                <div>{chainConfig.displayName}</div>
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
              {t("modal.network.cancel")}
            </button>
            <button
              type="button"
              className="w3a-button w3a-button--primary"
              onClick={() => {
                setShowModal(false);
                onAddNetwork(chainConfig.chainId);
              }}
            >
              {t("modal.network.proceed")}
            </button>
          </div>
        </div>
      </div>
    )
  );
}

export default AddNetwork;
