import Image from "./Image";

interface SwitchNetworkProps {
  currentChainId: string;
  newChainId: string;
  onSwitchNetwork: (currentChainId: string, newChainId: string) => void;
  onCancelNetwork: () => void;
}

function SwitchNetwork(props: SwitchNetworkProps) {
  const { currentChainId } = props;

  const networkIcon = <Image imageId="web3auth" height="14px" width="auto" />;

  return (
    <div className="w3a-modal__footer">
      <div className="w3a-footer">
        <div>
          <div className="w3a-footer__links">
            <a href="https://docs.web3auth.io/legal/terms-and-conditions">Terms of use</a>
            <span>|</span>
            <a href="https://docs.web3auth.io/legal/privacy-policy">Privacy policy</a>
          </div>
          <p>{currentChainId}</p>
        </div>
        <div className="w3a-footer__secured">
          <div>Secured by</div>
          {networkIcon}
        </div>
      </div>
    </div>
  );
}

export default SwitchNetwork;
