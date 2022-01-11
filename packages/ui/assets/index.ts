import CircleArrowLeft from "./icons/circle-arrow-left.svg";
import Close from "./icons/close.svg";
import Expand from "./icons/expand.svg";
import ExpandLight from "./icons/expand-light.svg";
import LoginApple from "./images/login-apple.svg";
import LoginAppleLight from "./images/login-apple-light.svg";
import LoginCustomAuthWallet from "./images/login-custom-auth.svg";
import LoginDiscord from "./images/login-discord.svg";
import LoginEmail from "./images/login-email.svg";
import LoginEmailPassword from "./images/login-email_password.svg";
import LoginFacebook from "./images/login-facebook.svg";
import LoginGithub from "./images/login-github.svg";
import LoginGithubLight from "./images/login-github-light.svg";
import LoginGoogle from "./images/login-google.svg";
import LoginJwt from "./images/login-jwt.svg";
import LoginKakao from "./images/login-kakao.svg";
import LoginLine from "./images/login-line.svg";
import LoginLinkedin from "./images/login-linkedin.svg";
import LoginMetamaskWallet from "./images/login-metamask-adapter.svg";
import LoginOpenloginWallet from "./images/login-openlogin.svg";
import LoginPhantomWallet from "./images/login-phantom-adapter.svg";
import LoginReddit from "./images/login-reddit.svg";
import LoginTelegram from "./images/login-telegram.svg";
import LoginTorusEvmWallet from "./images/login-torus-evm-adapter.svg";
import LoginTorusSolanaWallet from "./images/login-torus-solana-adapter.svg";
import LoginTwitch from "./images/login-twitch.svg";
import LoginTwitter from "./images/login-twitter.svg";
import LoginWechat from "./images/login-wechat.svg";
import LoginWeibo from "./images/login-weibo.svg";
import Staratlas from "./images/staratlas.svg";
import TorusPower from "./images/torus-power.svg";
import WalletConnect from "./images/wallet-connect.svg";
import Web3auth from "./images/web3auth.svg";
import Web3authLight from "./images/web3auth-light.svg";

function importAll(r) {
  const images = {};
  r.keys().map((item) => {
    images[item.replace("./", "")] = r(item);
    return true;
  });
  return images;
}

const images = importAll(require.context("../assets/images", false, /\.(png|jpe?g|svg)$/));
const icons = importAll(require.context("../assets/icons", false, /\.(png|jpe?g|svg)$/));

export { icons, images };

const getImageSrc = (image: string): string => {
  return !image.startsWith("<svg") ? `<img src="${image}" alt="">` : image;
};
export default {
  "login-apple": {
    image: getImageSrc(LoginApple),
  },
  "login-apple-light": {
    image: getImageSrc(LoginAppleLight),
  },
  "login-custom-auth": {
    image: getImageSrc(LoginCustomAuthWallet),
  },
  "login-discord": {
    image: getImageSrc(LoginDiscord),
  },
  "login-email": {
    image: getImageSrc(LoginEmail),
  },
  "login-email_password": {
    image: getImageSrc(LoginEmailPassword),
  },
  "login-facebook": {
    image: getImageSrc(LoginFacebook),
  },
  "login-github": {
    image: getImageSrc(LoginGithub),
  },
  "login-github-light": {
    image: getImageSrc(LoginGithubLight),
  },
  "login-google": {
    image: getImageSrc(LoginGoogle),
  },
  "login-jwt": {
    image: getImageSrc(LoginJwt),
  },
  "login-kakao": {
    image: getImageSrc(LoginKakao),
  },
  "login-line": {
    image: getImageSrc(LoginLine),
  },
  "login-linkedin": {
    image: getImageSrc(LoginLinkedin),
  },
  "login-metamask": {
    image: getImageSrc(LoginMetamaskWallet),
  },
  "login-openlogin": {
    image: getImageSrc(LoginOpenloginWallet),
  },
  "login-phantom": {
    image: getImageSrc(LoginPhantomWallet),
  },
  "login-reddit": {
    image: getImageSrc(LoginReddit),
  },
  "login-telegram": {
    image: getImageSrc(LoginTelegram),
  },
  "login-torus-evm": {
    image: getImageSrc(LoginTorusEvmWallet),
  },
  "login-torus-solana": {
    image: getImageSrc(LoginTorusSolanaWallet),
  },
  "login-twitch": {
    image: getImageSrc(LoginTwitch),
  },
  "login-twitter": {
    image: getImageSrc(LoginTwitter),
  },
  "login-wechat": {
    image: getImageSrc(LoginWechat),
  },
  "login-weibo": {
    image: getImageSrc(LoginWeibo),
  },
  staratlas: {
    image: getImageSrc(Staratlas),
  },
  "torus-power": {
    image: getImageSrc(TorusPower),
  },
  web3auth: {
    image: getImageSrc(Web3auth),
  },
  "web3auth-light": {
    image: getImageSrc(Web3authLight),
  },
  "arrow-left": {
    image: getImageSrc(CircleArrowLeft),
  },
  close: {
    image: getImageSrc(Close),
  },
  "expand-light": {
    image: getImageSrc(ExpandLight),
  },
  expand: {
    image: getImageSrc(Expand),
  },
  walletConnect: {
    image: getImageSrc(WalletConnect),
  },
};
