import { BUTTON_TYPE, ButtonProps } from "./Button.type";
import ButtonSocial, { type ButtonSocialProps } from "./ButtonSocial";
import ButtonWallet, { type ButtonWalletProps } from "./ButtonWallet";

function Button(props: ButtonProps) {
  const { type, props: buttonProps } = props;

  const SocialButtonProps = buttonProps as ButtonSocialProps;
  const WalletButtonProps = buttonProps as ButtonWalletProps;

  const { isDark: socialButtonIsDark, text, showIcon, showText, method, isPrimaryBtn, onClick, children, btnStyle, buttonRadius } = SocialButtonProps;
  const {
    isDark: walletButtonIsDark,
    label,
    onClick: walletOnClick,
    button,
    deviceDetails,
    walletConnectUri,
    buttonRadius: walletButtonRadius,
  } = WalletButtonProps;

  return (
    <>
      {type === BUTTON_TYPE.SOCIAL && (
        <ButtonSocial
          text={text}
          showIcon={showIcon}
          showText={showText}
          method={method}
          isDark={socialButtonIsDark}
          isPrimaryBtn={isPrimaryBtn}
          onClick={onClick}
          btnStyle={btnStyle}
          buttonRadius={buttonRadius}
        >
          {children}
        </ButtonSocial>
      )}
      {type === BUTTON_TYPE.WALLET && (
        <ButtonWallet
          isDark={walletButtonIsDark}
          label={label}
          walletConnectUri={walletConnectUri}
          onClick={walletOnClick}
          button={button}
          deviceDetails={deviceDetails}
          buttonRadius={walletButtonRadius}
        />
      )}
    </>
  );
}

export default Button;
