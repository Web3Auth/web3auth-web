import { BUTTON_TYPE, ButtonProps } from "./Button.type";
import ButtonSocial, { type ButtonSocialProps } from "./ButtonSocial";
import ButtonWallet, { type ButtonWalletProps } from "./ButtonWallet";

function Button(props: ButtonProps) {
  const { type, props: buttonProps } = props;

  const SocialButtonProps = buttonProps as ButtonSocialProps;
  const WalletButtonProps = buttonProps as ButtonWalletProps;

  const { text, showIcon, showText, method, isDark, isPrimaryBtn, onClick, children, btnStyle } = SocialButtonProps;
  const { label, onClick: walletOnClick, button, deviceDetails, walletConnectUri } = WalletButtonProps;

  return (
    <>
      {type === BUTTON_TYPE.SOCIAL && (
        <ButtonSocial
          text={text}
          showIcon={showIcon}
          showText={showText}
          method={method}
          isDark={isDark}
          isPrimaryBtn={isPrimaryBtn}
          onClick={onClick}
          btnStyle={btnStyle}
        >
          {children}
        </ButtonSocial>
      )}
      {type === BUTTON_TYPE.WALLET && (
        <ButtonWallet label={label} walletConnectUri={walletConnectUri} onClick={walletOnClick} button={button} deviceDetails={deviceDetails} />
      )}
    </>
  );
}

export default Button;
