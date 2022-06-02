import { ModalState, SocialLoginEventType } from "../interfaces";
import Icon from "./Icon";
import SocialLoginEmail from "./SocialLoginEmail";
import SocialLogins from "./SocialLogins";

interface SocialLoginButtonProps {
  modalState: ModalState;
  setModalState: (param) => void;
  areSocialLoginsVisible: boolean;
  preHandleSocialWalletClick: (params: SocialLoginEventType) => void;
  isEmailPasswordlessLoginVisible: boolean;
}
export default function SocialLoginButton(props: SocialLoginButtonProps) {
  const { modalState, setModalState, areSocialLoginsVisible, preHandleSocialWalletClick, isEmailPasswordlessLoginVisible } = props;

  return (
    <>
      {!modalState.hiddenSocialLogin && (
        <button
          type="button"
          className="w3a-external-back w3ajs-external-back"
          onClick={() => {
            setModalState((prevState) => {
              return { ...prevState, hiddenSocialLogin: !modalState.hiddenSocialLogin };
            });
          }}
        >
          <Icon iconName="arrow-left-new" cls="back-button-arrow" />
          <div className="w3a-footer__secured">Back</div>
        </button>
      )}
      {areSocialLoginsVisible ? (
        <SocialLogins
          handleSocialLoginClick={(params: SocialLoginEventType) => preHandleSocialWalletClick(params)}
          socialLoginsConfig={modalState.socialLoginsConfig}
        />
      ) : null}

      {isEmailPasswordlessLoginVisible && (
        <SocialLoginEmail
          adapter={modalState.socialLoginsConfig?.adapter}
          handleSocialLoginClick={(params: SocialLoginEventType) => preHandleSocialWalletClick(params)}
        />
      )}
    </>
  );
}
