import { METADATA_MAP, SIGNER_MAP } from "@toruslabs/constants";
import { WEB3AUTH_NETWORK, WEB3AUTH_NETWORK_TYPE } from "@web3auth/auth";

export interface ConfigEnv {
  // client ids
  googleClientId: string;
  appleClientId: string;
  discordClientId: string;
  facebookClientId: string;
  githubClientId: string;
  kakaoClientId: string;
  lineClientId: string;
  linkedinClientId: string;
  redditClientId: string;
  twitchClientId: string;
  twitterClientId: string;
  weiboClientId: string;
  wechatClientId: string;
  hostedEmailPasswordlessClientId: string;
  hostedSmsPasswordlessClientId: string;
  hostedFarcasterClientId?: string;
  passkeysClientId: string;
  authenticatorClientId: string;

  // tKey verifiers
  googleVerifier: string;
  appleVerifier: string;
  discordVerifier: string;
  facebookVerifier: string;
  githubVerifier: string;
  kakaoVerifier: string;
  lineVerifier: string;
  linkedinVerifier: string;
  redditVerifier: string;
  twitchVerifier: string;
  twitterVerifier: string;
  weiboVerifier: string;
  wechatVerifier: string;
  hostedEmailPasswordlessVerifier: string;
  hostedSmsPasswordlessVerifier: string;
  passkeysVerifier: string;
  authenticatorVerifier: string;
  hostedFarcasterVerifier?: string;

  // wallet verifiers
  walletGoogleVerifier?: string;
  walletAppleVerifier?: string;
  walletDiscordVerifier?: string;
  walletFacebookVerifier?: string;
  walletGithubVerifier?: string;
  walletKakaoVerifier?: string;
  walletLineVerifier?: string;
  walletLinkedinVerifier?: string;
  walletRedditVerifier?: string;
  walletTwitchVerifier?: string;
  walletTwitterVerifier?: string;
  walletWeiboVerifier?: string;
  walletWechatVerifier?: string;
  walletHostedEmailPasswordlessVerifier?: string;
  walletHostedSmsPasswordlessVerifier?: string;
  // login domain
  loginDomain: string;
  farcasterLoginDomain?: string;
  // tkey verifier sub identifier
  verifierSubIdentifier: string;
  signerHost: string;
  metadataHost: string;
}

export const configEnv: Record<WEB3AUTH_NETWORK_TYPE, ConfigEnv> = {
  [WEB3AUTH_NETWORK.CELESTE]: {
    // client ids - no client ids actually
    googleClientId: "876733105116-80tsjqj79glh40206qnuq0uri8dk1o5s.apps.googleusercontent.com",
    appleClientId: "5UNu0Kku0hkao8e5OgM4vglijiFbNpCJ",
    discordClientId: "936166141674520606",
    facebookClientId: "957274648509106",
    githubClientId: "9kyWrFgR6nnVQGSdns4eOpMHsu2kDQGG",
    kakaoClientId: "SOz19zmf9CTUX05rpNCPx0gcacdxVHQU",
    lineClientId: "E57NnYyXZVxB7wCtqev94AkrRY52Chzf",
    linkedinClientId: "fy52Q9blaWk5xyKisReH0PW3TPPCBoZE",
    redditClientId: "H0HxUmLs5HCuteyzEuHklZp1fo1Fz9tv",
    twitchClientId: "owmmb3h8kcv7dpk7t7q0cnw5wfhyeo",
    twitterClientId: "PDivfIQrz4kwpBZKKr2m0kP1F0k4Oswk",
    weiboClientId: "ugqRyaPpzhr1FAqX4y0H4yvvS8CwE0ei",
    wechatClientId: "15MPSyfqCmoxcWHUOh9zNLpgXms4C0ho",
    hostedEmailPasswordlessClientId: "KG7zk89X3QgttSyX9NJ4fGEyFNhOcJTw",
    hostedSmsPasswordlessClientId: "KG7zk89X3QgttSyX9NJ4fGEyFNhOcJTw",
    authenticatorClientId: "7aIvQVapAfmJpikqo7m2PRQpNBu5QnHC",
    passkeysClientId: "passkey",

    // tKey verifiers
    googleVerifier: "tkey-google-celeste",
    appleVerifier: "tkey-auth0-apple-celeste",
    discordVerifier: "tkey-discord-celeste",
    facebookVerifier: "tkey-facebook-celeste",
    githubVerifier: "tkey-auth0-github-celeste",
    kakaoVerifier: "tkey-auth0-kakao-celeste",
    lineVerifier: "tkey-auth0-line-celeste",
    linkedinVerifier: "tkey-auth0-linkedin-celeste",
    redditVerifier: "tkey-reddit-celeste",
    twitchVerifier: "tkey-twitch-celeste",
    twitterVerifier: "tkey-auth0-twitter-celeste",
    weiboVerifier: "tkey-auth0-weibo-celeste",
    wechatVerifier: "tkey-auth0-wechat-celeste",
    hostedEmailPasswordlessVerifier: "tkey-auth0-email-passwordless-celeste",
    hostedSmsPasswordlessVerifier: "tkey-sms-passwordless-celeste",
    passkeysVerifier: "", // TODO: change to webauthn-celeste
    authenticatorVerifier: "tkey-authenticator-celeste",
    // tkey verifier sub identifier
    loginDomain: "https://torus.au.auth0.com",
    verifierSubIdentifier: "torus",
    metadataHost: METADATA_MAP[WEB3AUTH_NETWORK.CELESTE],
    signerHost: SIGNER_MAP[WEB3AUTH_NETWORK.CELESTE],
  },
  [WEB3AUTH_NETWORK.AQUA]: {
    // client ids
    googleClientId: "876733105116-80tsjqj79glh40206qnuq0uri8dk1o5s.apps.googleusercontent.com",
    appleClientId: "5UNu0Kku0hkao8e5OgM4vglijiFbNpCJ",
    discordClientId: "936166141674520606",
    facebookClientId: "957274648509106",
    githubClientId: "9kyWrFgR6nnVQGSdns4eOpMHsu2kDQGG",
    kakaoClientId: "SOz19zmf9CTUX05rpNCPx0gcacdxVHQU",
    lineClientId: "E57NnYyXZVxB7wCtqev94AkrRY52Chzf",
    linkedinClientId: "fy52Q9blaWk5xyKisReH0PW3TPPCBoZE",
    redditClientId: "H0HxUmLs5HCuteyzEuHklZp1fo1Fz9tv",
    twitchClientId: "owmmb3h8kcv7dpk7t7q0cnw5wfhyeo",
    twitterClientId: "PDivfIQrz4kwpBZKKr2m0kP1F0k4Oswk",
    weiboClientId: "ugqRyaPpzhr1FAqX4y0H4yvvS8CwE0ei",
    wechatClientId: "15MPSyfqCmoxcWHUOh9zNLpgXms4C0ho",
    hostedEmailPasswordlessClientId: "KG7zk89X3QgttSyX9NJ4fGEyFNhOcJTw",
    hostedSmsPasswordlessClientId: "KG7zk89X3QgttSyX9NJ4fGEyFNhOcJTw",
    hostedFarcasterClientId: "2da622b8b670e064",
    farcasterLoginDomain: "https://farcaster.web3auth.io",
    authenticatorClientId: "meskAVRzY5DgRUvNgoijhcCkb81cSAvz",
    passkeysClientId: "passkey",
    // tKey verifiers
    googleVerifier: "tkey-google-aqua",
    appleVerifier: "tkey-auth0-apple-aqua",
    discordVerifier: "tkey-discord-aqua",
    facebookVerifier: "tkey-facebook-aqua",
    githubVerifier: "tkey-auth0-github-aqua",
    kakaoVerifier: "tkey-auth0-kakao-aqua",
    lineVerifier: "tkey-auth0-line-aqua",
    linkedinVerifier: "tkey-auth0-linkedin-aqua",
    redditVerifier: "tkey-reddit-aqua",
    twitchVerifier: "tkey-twitch-aqua",
    twitterVerifier: "tkey-auth0-twitter-aqua",
    weiboVerifier: "tkey-auth0-weibo-aqua",
    wechatVerifier: "tkey-auth0-wechat-aqua",
    hostedEmailPasswordlessVerifier: "tkey-auth0-email-passwordless-aqua",
    hostedSmsPasswordlessVerifier: "tkey-sms-passwordless-aqua",
    passkeysVerifier: "passkey-legacy-aqua",
    hostedFarcasterVerifier: "tkey-farcaster-aqua",
    authenticatorVerifier: "tkey-authenticator-aqua",

    loginDomain: "https://torus.au.auth0.com",
    // tkey verifier sub identifier
    verifierSubIdentifier: "torus",
    metadataHost: METADATA_MAP[WEB3AUTH_NETWORK.AQUA],
    signerHost: SIGNER_MAP[WEB3AUTH_NETWORK.AQUA],
  },
  [WEB3AUTH_NETWORK.CYAN]: {
    // client ids
    googleClientId: "876733105116-80tsjqj79glh40206qnuq0uri8dk1o5s.apps.googleusercontent.com",
    appleClientId: "5UNu0Kku0hkao8e5OgM4vglijiFbNpCJ",
    discordClientId: "936166141674520606",
    facebookClientId: "957274648509106",
    githubClientId: "9kyWrFgR6nnVQGSdns4eOpMHsu2kDQGG",
    kakaoClientId: "SOz19zmf9CTUX05rpNCPx0gcacdxVHQU",
    lineClientId: "E57NnYyXZVxB7wCtqev94AkrRY52Chzf",
    linkedinClientId: "fy52Q9blaWk5xyKisReH0PW3TPPCBoZE",
    redditClientId: "H0HxUmLs5HCuteyzEuHklZp1fo1Fz9tv",
    twitchClientId: "owmmb3h8kcv7dpk7t7q0cnw5wfhyeo",
    twitterClientId: "PDivfIQrz4kwpBZKKr2m0kP1F0k4Oswk",
    weiboClientId: "ugqRyaPpzhr1FAqX4y0H4yvvS8CwE0ei",
    wechatClientId: "15MPSyfqCmoxcWHUOh9zNLpgXms4C0ho",
    hostedEmailPasswordlessClientId: "KG7zk89X3QgttSyX9NJ4fGEyFNhOcJTw",
    hostedSmsPasswordlessClientId: "KG7zk89X3QgttSyX9NJ4fGEyFNhOcJTw",
    hostedFarcasterClientId: "219c9ae7883f3374",
    farcasterLoginDomain: "https://farcaster.web3auth.io",
    authenticatorClientId: "wXbSBpKPOinGeY0FcBxjayQYjD4zhpgW",

    // tKey verifiers
    googleVerifier: "tkey-google-cyan",
    appleVerifier: "tkey-auth0-apple-cyan",
    discordVerifier: "tkey-discord-cyan",
    facebookVerifier: "tkey-facebook-cyan",
    githubVerifier: "tkey-auth0-github-cyan",
    kakaoVerifier: "tkey-auth0-kakao-cyan",
    lineVerifier: "tkey-auth0-line-cyan",
    linkedinVerifier: "tkey-auth0-linkedin-cyan",
    redditVerifier: "tkey-reddit-cyan",
    twitchVerifier: "tkey-twitch-cyan",
    twitterVerifier: "tkey-auth0-twitter-cyan",
    weiboVerifier: "tkey-auth0-weibo-cyan",
    wechatVerifier: "tkey-auth0-wechat-cyan",
    hostedEmailPasswordlessVerifier: "tkey-auth0-email-passwordless-cyan",
    hostedSmsPasswordlessVerifier: "tkey-sms-passwordless-cyan",
    passkeysVerifier: "passkey-legacy-cyan",
    passkeysClientId: "passkey",
    hostedFarcasterVerifier: "tkey-farcaster-cyan",
    authenticatorVerifier: "tkey-authenticator-cyan",

    // tkey verifier sub identifier
    loginDomain: "https://torus.au.auth0.com",
    verifierSubIdentifier: "torus",
    metadataHost: METADATA_MAP[WEB3AUTH_NETWORK.CYAN],
    signerHost: SIGNER_MAP[WEB3AUTH_NETWORK.CYAN],
  },
  [WEB3AUTH_NETWORK.MAINNET]: {
    // client ids
    googleClientId: "876733105116-i0hj3s53qiio5k95prpfmj0hp0gmgtor.apps.googleusercontent.com",
    appleClientId: "FURCtS8ni75fvwE0nftxSV39u7JaX7X6",
    discordClientId: "630308572013527060",
    facebookClientId: "2554219104599979",
    githubClientId: "bbDQ4eCvCrjY2BGR6OES8qjbMgQDTVHz",
    kakaoClientId: "wpkcc7alGJjEgjaL6q5AWRqgRWHFsdTL",
    lineClientId: "a4jD59wm3e5SpXyfH06HIz63iZRjWxan",
    linkedinClientId: "hgmrH20a7SE1Cpuha1Ke6RlHTdnNwp8a",
    redditClientId: "9dHPrJNbLI7O40dioNipXqAjFbMjAGJR",
    twitchClientId: "tfppratfiloo53g1x133ofa4rc29px",
    twitterClientId: "OPUyrj5G82ZDL1FU1J5Ve3OvQzAsQxy9",
    weiboClientId: "2bfYXOQTB4hcjPeQ03iFuKS5IZ3Mww6H",
    wechatClientId: "cewDD3i6F1vtHeV1KIbaxUZ8vJQjJZ8V",
    hostedEmailPasswordlessClientId: "BDIXq6ryHwTGwN11LFo4kwiMGY50zPip",
    hostedSmsPasswordlessClientId: "BDIXq6ryHwTGwN11LFo4kwiMGY50zPip",
    hostedFarcasterClientId: "f9649680a8716472",
    farcasterLoginDomain: "https://farcaster.web3auth.io",
    authenticatorClientId: "NgpblMzsrw8Ph5JHhHSroFFGJQ8UMUFS",

    // tKey verifiers
    googleVerifier: "tkey-google",
    appleVerifier: "tkey-auth0-apple",
    discordVerifier: "tkey-discord",
    facebookVerifier: "tkey-facebook",
    githubVerifier: "tkey-auth0-github",
    kakaoVerifier: "tkey-auth0-kakao",
    lineVerifier: "tkey-auth0-line",
    linkedinVerifier: "tkey-auth0-linkedin",
    redditVerifier: "tkey-reddit",
    twitchVerifier: "tkey-twitch",
    twitterVerifier: "tkey-auth0-twitter",
    weiboVerifier: "tkey-auth0-weibo",
    wechatVerifier: "tkey-auth0-wechat",
    hostedEmailPasswordlessVerifier: "tkey-auth0-email-passwordless",
    hostedSmsPasswordlessVerifier: "tkey-sms-passwordless",
    passkeysVerifier: "passkey-legacy-mainnet",
    passkeysClientId: "passkey",
    hostedFarcasterVerifier: "tkey-farcaster",
    authenticatorVerifier: "tkey-authenticator",

    // wallet verifiers
    walletGoogleVerifier: "google",
    walletAppleVerifier: "torus-auth0-apple",
    walletDiscordVerifier: "discord",
    walletFacebookVerifier: "facebook",
    walletGithubVerifier: "torus-auth0-github",
    walletKakaoVerifier: "torus-auth0-kakao",
    walletLineVerifier: "torus-auth0-line",
    walletLinkedinVerifier: "torus-auth0-linkedin",
    walletRedditVerifier: "reddit",
    walletTwitchVerifier: "twitch",
    walletTwitterVerifier: "torus-auth0-twitter",
    walletWeiboVerifier: "torus-auth0-weibo",
    walletWechatVerifier: "torus-auth0-wechat",
    walletHostedEmailPasswordlessVerifier: "torus-auth0-email-passwordless",
    walletHostedSmsPasswordlessVerifier: "torus-sms-passwordless",
    // tkey verifier sub identifier
    loginDomain: "https://torus.au.auth0.com",
    verifierSubIdentifier: "torus",
    metadataHost: METADATA_MAP[WEB3AUTH_NETWORK.MAINNET],
    signerHost: SIGNER_MAP[WEB3AUTH_NETWORK.MAINNET],
  },
  [WEB3AUTH_NETWORK.TESTNET]: {
    // client ids
    googleClientId: "221898609709-obfn3p63741l5333093430j3qeiinaa8.apps.googleusercontent.com",
    appleClientId: "m1Q0gvDfOyZsJCZ3cucSQEe9XMvl9d9L",
    discordClientId: "682533837464666198",
    facebookClientId: "617201755556395",
    githubClientId: "PC2a4tfNRvXbT48t89J5am0oFM21Nxff",
    kakaoClientId: "GW10hvrnQyZ9uRAw41ZOnTRI3jfn0TTC",
    lineClientId: "WN8bOmXKNRH1Gs8k475glfBP5gDZr9H1",
    linkedinClientId: "59YxSgx79Vl3Wi7tQUBqQTRTxWroTuoc",
    redditClientId: "RKlRuuRoDKOItbJSoOZabDLzizvd1uKn",
    twitchClientId: "f5and8beke76mzutmics0zu4gw10dj",
    twitterClientId: "A7H8kkcmyFRlusJQ9dZiqBLraG2yWIsO",
    weiboClientId: "dhFGlWQMoACOI5oS5A1jFglp772OAWr1",
    wechatClientId: "jdwoYRr82b6YcHC118QT0ITHF2oMpzgb",
    hostedEmailPasswordlessClientId: "P7PJuBCXIHP41lcyty0NEb7Lgf7Zme8Q",
    hostedSmsPasswordlessClientId: "P7PJuBCXIHP41lcyty0NEb7Lgf7Zme8Q",
    hostedFarcasterClientId: "ff022117fbfe5103",
    farcasterLoginDomain: "https://farcaster.web3auth.io",
    authenticatorClientId: "QwRLdOCmMreICZf3tRGvAWu6l5lDRo88",

    // tKey verifiers
    googleVerifier: "tkey-google-lrc",
    appleVerifier: "tkey-auth0-apple-lrc",
    discordVerifier: "tkey-discord-lrc",
    facebookVerifier: "tkey-facebook-lrc",
    githubVerifier: "tkey-auth0-github-lrc",
    kakaoVerifier: "tkey-auth0-kakao-lrc",
    lineVerifier: "tkey-auth0-line-lrc",
    linkedinVerifier: "tkey-auth0-linkedin-lrc",
    redditVerifier: "tkey-reddit-lrc",
    twitchVerifier: "tkey-twitch-lrc",
    twitterVerifier: "tkey-auth0-twitter-lrc",
    weiboVerifier: "tkey-auth0-weibo-lrc",
    wechatVerifier: "tkey-auth0-wechat-lrc",
    hostedEmailPasswordlessVerifier: "tkey-auth0-email-passwordless-lrc",
    hostedSmsPasswordlessVerifier: "tkey-sms-passwordless-lrc",
    passkeysVerifier: "passkey-legacy-testnet",
    passkeysClientId: "passkey",
    hostedFarcasterVerifier: "tkey-farcaster-auth-lrc",
    authenticatorVerifier: "tkey-authenticator-lrc",

    // wallet verifiers
    walletGoogleVerifier: "google-lrc",
    walletAppleVerifier: "torus-auth0-apple-lrc",
    walletDiscordVerifier: "discord-lrc",
    walletFacebookVerifier: "facebook-lrc",
    walletGithubVerifier: "torus-auth0-github-lrc",
    walletKakaoVerifier: "torus-auth0-kakao-lrc",
    walletLineVerifier: "torus-auth0-line-lrc",
    walletLinkedinVerifier: "torus-auth0-linkedin-lrc",
    walletRedditVerifier: "reddit-lrc",
    walletTwitchVerifier: "twitch-lrc",
    walletTwitterVerifier: "torus-auth0-twitter-lrc",
    walletWeiboVerifier: "torus-auth0-weibo-lrc",
    walletWechatVerifier: "torus-auth0-wechat-lrc",
    walletHostedEmailPasswordlessVerifier: "torus-auth0-email-passwordless-lrc",
    walletHostedSmsPasswordlessVerifier: "torus-sms-passwordless-lrc",
    // tkey verifier sub identifier
    loginDomain: "https://torus-test.auth0.com",
    verifierSubIdentifier: "torus",
    metadataHost: METADATA_MAP[WEB3AUTH_NETWORK.TESTNET],
    signerHost: SIGNER_MAP[WEB3AUTH_NETWORK.TESTNET],
  },
  [WEB3AUTH_NETWORK.SAPPHIRE_DEVNET]: {
    // client ids
    googleClientId: "221898609709-qnfklddleh1m1m7bq6g8d8dakffp0n86.apps.googleusercontent.com",
    appleClientId: "ADG0f0EZsBHvcbu2in7W938XngxJQJrJ",
    discordClientId: "1126902533936394330",
    facebookClientId: "226597929760394",
    githubClientId: "srB1w8yWLtvD8QFqp4FgzAPHkmJ6FU5M",
    kakaoClientId: "HlQEmgP1izbU0vB3GVI5NZcUbwPXdmsR",
    lineClientId: "AUDHMShLlzzS15cb9F8IjYQHBbfWO5iB",
    linkedinClientId: "gCzESkrR2LZDQS1gZIARcRzWvayFUWjv",
    redditClientId: "XfiFWQbsZ9t5WQ4TfzHWZOpEghkNskko",
    twitchClientId: "94nxxpy7inarina6kc9hyg2ao3mja2",
    twitterClientId: "wz4w3pdutXsbmWltyUJjq1pyaoF0GBxW",
    weiboClientId: "X3BSYMr3BVZFVls6XOEMZ4VdOTW58mQZ",
    wechatClientId: "NSYFTvylXVlX6a4txGQaQ9cE9oU15QGU",
    hostedEmailPasswordlessClientId: "d84f6xvbdV75VTGmHiMWfZLeSPk8M07C",
    hostedSmsPasswordlessClientId: "4jK24VpfepWRSe5EMdd2if0RBD55pAuA",
    hostedFarcasterClientId: "77c9e93ee43a5fb0",
    farcasterLoginDomain: "https://farcaster.web3auth.io",
    authenticatorClientId: "XiKrmltCKt6vEhz0c1a9gipzZHhppr01",

    // tKey verifiers
    googleVerifier: "web3auth-google-sapphire-devnet",
    appleVerifier: "web3auth-auth0-apple-sapphire-devnet",
    discordVerifier: "web3auth-discord-sapphire-devnet",
    facebookVerifier: "web3auth-facebook-sapphire-devnet",
    githubVerifier: "web3auth-auth0-github-sapphire-devnet",
    kakaoVerifier: "web3auth-auth0-kakao-sapphire-devnet",
    hostedFarcasterVerifier: "web3auth-farcaster-sapphire-devnet",
    lineVerifier: "web3auth-auth0-line-sapphire-devnet",
    linkedinVerifier: "web3auth-auth0-linkedin-sapphire-devnet",
    redditVerifier: "web3auth-auth0-reddit-sapphire-devnet",
    twitchVerifier: "web3auth-twitch-sapphire-devnet",
    twitterVerifier: "web3auth-auth0-twitter-sapphire-devnet",
    weiboVerifier: "web3auth-auth0-weibo-sapphire-devnet",
    wechatVerifier: "web3auth-auth0-wechat-sapphire-devnet",
    hostedEmailPasswordlessVerifier: "web3auth-auth0-email-passwordless-sapphire-devnet",
    hostedSmsPasswordlessVerifier: "web3auth-auth0-sms-passwordless-sapphire-devnet",
    passkeysVerifier: "passkey-sapphire-devnet",
    passkeysClientId: "passkey",
    authenticatorVerifier: "web3auth-authenticator-sapphire-devnet",
    // tkey verifier sub identifier
    loginDomain: "https://torus-test.auth0.com",
    verifierSubIdentifier: "web3auth",
    metadataHost: "",
    signerHost: SIGNER_MAP[WEB3AUTH_NETWORK.SAPPHIRE_DEVNET], // used for allow host
  },
  [WEB3AUTH_NETWORK.SAPPHIRE_MAINNET]: {
    // client ids
    googleClientId: "876733105116-gksnup3bm0nngpucmerrp9qrt15igcih.apps.googleusercontent.com",
    appleClientId: "2ZsUMrUcXTIOIP9VwarKwEseBu7jnBvR",
    discordClientId: "1135962294761824316",
    facebookClientId: "599696922222388",
    githubClientId: "cCaKDbd3U3qLK8Eh9lXFo5ZD59Lj4LLg",
    kakaoClientId: "GlEDRR3FmvQ26nqiPddeqyqiz1VUpqNf",
    lineClientId: "rkerdvKbiRk1NaJXE6diAQWG4ckdvENZ",
    linkedinClientId: "HPdrWQqltA4HjJTvDTrbixTSk0BhtQUr",
    redditClientId: "6jZCC08uyG54QVAqDFd8GxTNMbF1u7LG",
    twitchClientId: "tl3sd6b61rm2jjjzatmvd4f6omw072",
    twitterClientId: "ODXwxg9r4HOC5Af7odbQFjIEa5YxFhVG",
    weiboClientId: "PJo40QUsFNF2KO0nwQ2Qgd16hfRWtw0R",
    wechatClientId: "IiC2dvjR3BNpEEn9iwTrTUv4cQxctUsY",
    hostedEmailPasswordlessClientId: "zz6FAnVObMSfLYAk5P3FmJZLZLBHj8uE",
    hostedSmsPasswordlessClientId: "Mif51jk0HLQ0GpPiBmSIYqO6uPzcj18i",
    hostedFarcasterClientId: "6df6481ef7891e18",
    farcasterLoginDomain: "https://farcaster.web3auth.io",
    authenticatorClientId: "K8hUbrEfBcFe2QkpFPxalw3u2OeNNHG0",

    // tKey verifiers
    googleVerifier: "web3auth-google-sapphire",
    appleVerifier: "web3auth-auth0-apple-sapphire",
    discordVerifier: "web3auth-discord-sapphire",
    facebookVerifier: "web3auth-facebook-sapphire",
    githubVerifier: "web3auth-auth0-github-sapphire",
    kakaoVerifier: "web3auth-auth0-kakao-sapphire",
    lineVerifier: "web3auth-auth0-line-sapphire",
    linkedinVerifier: "web3auth-auth0-linkedin-sapphire",
    redditVerifier: "web3auth-auth0-reddit-sapphire",
    twitchVerifier: "web3auth-twitch-sapphire",
    twitterVerifier: "web3auth-auth0-twitter-sapphire",
    weiboVerifier: "web3auth-auth0-weibo-sapphire",
    wechatVerifier: "web3auth-auth0-wechat-sapphire",
    hostedEmailPasswordlessVerifier: "web3auth-auth0-email-passwordless-sapphire",
    hostedSmsPasswordlessVerifier: "web3auth-auth0-sms-passwordless-sapphire",
    passkeysVerifier: "passkey-sapphire-mainnet",
    passkeysClientId: "passkey",
    hostedFarcasterVerifier: "web3auth-farcaster-sapphire",
    authenticatorVerifier: "web3auth-authenticator-sapphire",

    // tkey verifier sub identifier
    loginDomain: "https://torus.au.auth0.com",
    verifierSubIdentifier: "web3auth",
    metadataHost: "",
    signerHost: SIGNER_MAP[WEB3AUTH_NETWORK.SAPPHIRE_MAINNET], // used for allow host
  },
};
