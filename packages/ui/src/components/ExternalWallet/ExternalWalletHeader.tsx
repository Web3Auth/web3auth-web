import Icon from "../Icon";

interface ExternalWalletHeaderProps {
  title: string;
  goBack: () => void;
  disableBackButton?: boolean;
  closeModal: () => void;
}

export default function ExternalWalletHeader(props: ExternalWalletHeaderProps) {
  const { title, goBack, closeModal, disableBackButton } = props;

  return (
    <div className="w3a--flex w3a--flex-row w3a--justify-center w3a--items-center w3a--gap-1">
      <div className="w3a--flex-grow-1 w3a--flex-shrink-0 w3a--items-center w3a--justify-start w3a--mr-auto">
        {!disableBackButton && (
          <button type="button" className="w3a-external-back w3ajs-external-back" onClick={goBack}>
            <Icon iconName="arrow-left-light" darkIconName="arrow-left-dark" width="16" height="16" />
          </button>
        )}
      </div>
      <div className="w3a-header__title w3a--flex-grow-0 w3a--flex-shrink w3a--truncate w3a--mr-6">{title}</div>
      <div className="w3a--flex-grow-1 w3a--flex-shrink-0 w3a--items-center w3a--justify-end w3a--ml-auto">
        <button type="button" onClick={closeModal} className="w3a-header__button_wallet w3ajs-close-btn">
          <Icon iconName="x-light" darkIconName="x-dark" />
        </button>
      </div>
    </div>
  );
}
