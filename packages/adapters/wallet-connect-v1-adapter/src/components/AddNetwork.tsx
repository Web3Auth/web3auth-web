import Image from "./Image";

interface AddNetworkProps {
  chainId: string;
  onAddNetwork: (chainId: string) => void;
  onCancelNetwork: () => void;
}

function AddNetwork(props: AddNetworkProps) {
  const { chainId } = props;

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
          <p>{chainId}</p>
        </div>
        <div className="w3a-footer__secured">
          <div>Secured by</div>
          {networkIcon}
        </div>
      </div>
    </div>
  );
}

export default AddNetwork;
