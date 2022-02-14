import AllImages from "../../src/components/Icon";

interface ModalProps {
  isDark: boolean;
  appLogo: string;
  version: string;
}

const closeIcon = AllImages.close.image;

export default function Modal(props: ModalProps) {
  const { isDark, appLogo, version } = props;
  const web3authIcon = AllImages[`web3auth${isDark ? "-light" : ""}`].image;
  const modalClassName = `w3a-modal w3a-modal--hidden${isDark ? "" : " w3a-modal--light"}`;
  return (
    <div id="w3a-modal" className={modalClassName}>
      <div className="w3a-modal__inner w3ajs-inner">
        <div className="w3a-modal__header">
          <div className="w3a-header">
            <img className="w3a-header__logo" src={appLogo} alt="" />
            <div>
              <h1 className="w3a-header__title">Sign in</h1>
              <p className="w3a-header__subtitle">Select one of the following to continue</p>
            </div>
          </div>
          <button className="w3a-header__button w3ajs-close-btn">${closeIcon}</button> {/* TODO: add button handlers here */}
        </div>
        <div className="w3a-modal__content w3ajs-content">{/* {{ TODO: content here}} */}</div>
        <div className="w3a-modal__footer">
          <div className="w3a-footer">
            <div>
              <div className="w3a-footer__links">
                <a href="">Terms of use</a>
                <span>|</span>
                <a href="">Privacy policy</a>
              </div>
              <p>${version}</p>
            </div>
            <div className="w3a-footer__secured">
              <div>Secured by</div>${web3authIcon}
            </div>
          </div>
        </div>
        <div className="w3ajs-modal-loader w3a-modal__loader w3a-modal__loader--hidden">
          <div className="w3a-modal__loader-content">
            <div className="w3a-modal__loader-info">
              <div className="w3ajs-modal-loader__spinner w3a-spinner">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
              <div className="w3ajs-modal-loader__label w3a-spinner-label"></div>
              <div className="w3ajs-modal-loader__message w3a-spinner-message" style={{ display: "none" }}></div>
            </div>
            <div className="w3a-spinner-power">
              <div>Secured by</div>${web3authIcon}
            </div>
          </div>
          <button className="w3a-header__button w3ajs-loader-close-btn">${closeIcon}</button>
        </div>
      </div>
    </div>
  );
}
