import CircleArrowLeft from "../assets/icons/circle-arrow-left.svg";
import Close from "../assets/icons/close.svg";
import Expand from "../assets/icons/expand.svg";
import ExpandLight from "../assets/icons/expand-light.svg";
import LoginApple from "../assets/images/login-apple.svg";
import LoginAppleLight from "../assets/images/login-apple-light.svg";
import LoginCustomAuthWallet from "../assets/images/login-custom-auth-wallet.svg";
import LoginDiscord from "../assets/images/login-discord.svg";
import LoginEmail from "../assets/images/login-email.svg";
import LoginEmailPassword from "../assets/images/login-email_password.svg";
import LoginFacebook from "../assets/images/login-facebook.svg";
import LoginGithub from "../assets/images/login-github.svg";
import LoginGithubLight from "../assets/images/login-github-light.svg";
import LoginGoogle from "../assets/images/login-google.svg";
import LoginJwt from "../assets/images/login-jwt.svg";
import LoginKakao from "../assets/images/login-kakao.svg";
import LoginLine from "../assets/images/login-line.svg";
import LoginLinkedin from "../assets/images/login-linkedin.svg";
import LoginMetamaskWallet from "../assets/images/login-metamask-wallet.svg";
import LoginOpenloginWallet from "../assets/images/login-openlogin-wallet.svg";
import LoginPhantomWallet from "../assets/images/login-phantom-wallet.svg";
import LoginReddit from "../assets/images/login-reddit.svg";
import LoginTelegram from "../assets/images/login-telegram.svg";
import LoginTorusEvmWallet from "../assets/images/login-torus-evm-wallet.svg";
import LoginTorusSolanaWallet from "../assets/images/login-torus-solana-wallet.svg";
import LoginTwitch from "../assets/images/login-twitch.svg";
import LoginTwitter from "../assets/images/login-twitter.svg";
import LoginWechat from "../assets/images/login-wechat.svg";
import LoginWeibo from "../assets/images/login-weibo.svg";
import Staratlas from "../assets/images/staratlas.svg";
import TorusPower from "../assets/images/torus-power.svg";
import WalletConnect from "../assets/images/wallet-connect.svg";
import Web3auth from "../assets/images/web3auth.svg";
import Web3authLight from "../assets/images/web3auth-light.svg";

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
  "login-custom-auth-wallet": {
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
  "login-metamask-wallet": {
    image: LoginMetamaskWallet,
  },
  "login-openlogin-wallet": {
    image: LoginOpenloginWallet,
  },
  "login-phantom-wallet": {
    image: LoginPhantomWallet,
  },
  "login-reddit": {
    image: LoginReddit,
  },
  "login-telegram": {
    image: LoginTelegram,
  },
  "login-torus-evm-wallet": {
    image: LoginTorusEvmWallet,
  },
  "login-torus-solana-wallet": {
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
  walletConnect: {
    image: WalletConnect,
  },
};
