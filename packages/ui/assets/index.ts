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
export default {
  "login-apple": {
    image: LoginApple,
  },
  "login-apple-light": {
    image: LoginAppleLight,
  },
  "login-custom-auth": {
    image: LoginCustomAuthWallet,
  },
  "login-discord": {
    image: LoginDiscord,
  },
  "login-email": {
    image: LoginEmail,
  },
  "login-email_password": {
    image: LoginEmailPassword,
  },
  "login-facebook": {
    image: LoginFacebook,
  },
  "login-github": {
    image: LoginGithub,
  },
  "login-github-light": {
    image: LoginGithubLight,
  },
  "login-google": {
    image: LoginGoogle,
  },
  "login-jwt": {
    image: LoginJwt,
  },
  "login-kakao": {
    image: LoginKakao,
  },
  "login-line": {
    image: LoginLine,
  },
  "login-linkedin": {
    image: LoginLinkedin,
  },
  "login-metamask": {
    image: LoginMetamaskWallet,
  },
  "login-openlogin": {
    image: LoginOpenloginWallet,
  },
  "login-phantom": {
    image: LoginPhantomWallet,
  },
  "login-reddit": {
    image: LoginReddit,
  },
  "login-telegram": {
    image: LoginTelegram,
  },
  "login-torus-evm": {
    image: LoginTorusEvmWallet,
  },
  "login-torus-solana": {
    image: LoginTorusSolanaWallet,
  },
  "login-twitch": {
    image: LoginTwitch,
  },
  "login-twitter": {
    image: LoginTwitter,
  },
  "login-wechat": {
    image: LoginWechat,
  },
  "login-weibo": {
    image: LoginWeibo,
  },
  staratlas: {
    image: Staratlas,
  },
  "torus-power": {
    image: TorusPower,
  },
  web3auth: {
    image: Web3auth,
  },
  "web3auth-light": {
    image: Web3authLight,
  },
  "arrow-left": {
    image: CircleArrowLeft,
  },
  close: {
    image: Close,
  },
  "expand-light": {
    image: ExpandLight,
  },
  expand: {
    image: Expand,
  },
};
