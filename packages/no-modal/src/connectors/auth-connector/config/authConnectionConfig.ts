import {
  APPLE_LOGIN_PROVIDER,
  AUTH_CONNECTION,
  AuthConnectionConfig,
  AuthConnectionConfigItem,
  AUTHENTICATOR_LOGIN_PROVIDER,
  BUILD_ENV_TYPE,
  DISCORD_LOGIN_PROVIDER,
  EMAIL_FLOW,
  FACEBOOK_LOGIN_PROVIDER,
  GITHUB_LOGIN_PROVIDER,
  GOOGLE_LOGIN_PROVIDER,
  KAKAO_LOGIN_PROVIDER,
  LINE_LOGIN_PROVIDER,
  LINKEDIN_LOGIN_PROVIDER,
  PASSKEYS_LOGIN_PROVIDER,
  REDDIT_LOGIN_PROVIDER,
  TWITCH_LOGIN_PROVIDER,
  TWITTER_LOGIN_PROVIDER,
  WEB3AUTH_NETWORK_TYPE,
} from "@web3auth/auth";

import configBuild from "./config-build";
import configEnv from "./config-env";

export const getAuthConnectionConfig = (environment: BUILD_ENV_TYPE, network: WEB3AUTH_NETWORK_TYPE): AuthConnectionConfig => {
  const currentConfigEnv = configEnv[network];
  const currentBuildEnv = configBuild[environment];
  if (!currentConfigEnv || !currentBuildEnv) {
    throw new Error("Invalid environment settings");
  }

  return [
    {
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.googleVerifier,
      authConnection: AUTH_CONNECTION.GOOGLE,
      name: GOOGLE_LOGIN_PROVIDER,
      description: "login.verifier-google-desc",
      clientId: currentConfigEnv.googleClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.googleVerifier : "",
      mainOption: true,
      // For torus only
      walletAuthConnectionId: currentConfigEnv.walletGoogleVerifier,
    } as AuthConnectionConfigItem,
    {
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.facebookVerifier,
      authConnection: AUTH_CONNECTION.FACEBOOK,
      name: FACEBOOK_LOGIN_PROVIDER,
      description: "",
      clientId: currentConfigEnv.facebookClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.facebookVerifier : "",
      mainOption: true,
      // For torus only
      walletAuthConnectionId: currentConfigEnv.walletFacebookVerifier,
    } as AuthConnectionConfigItem,
    {
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.twitterVerifier,
      authConnection: AUTH_CONNECTION.TWITTER,
      name: TWITTER_LOGIN_PROVIDER,
      description: "",
      clientId: currentConfigEnv.twitterClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.twitterVerifier : "",
      mainOption: true,
      jwtParameters: {
        domain: currentConfigEnv.loginDomain,
        connection: "twitter",
        isUserIdCaseSensitive: false,
      },
      // For torus only
      walletAuthConnectionId: currentConfigEnv.walletTwitterVerifier,
    } as AuthConnectionConfigItem,
    {
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.discordVerifier,
      authConnection: AUTH_CONNECTION.DISCORD,
      name: DISCORD_LOGIN_PROVIDER,
      description: "",
      clientId: currentConfigEnv.discordClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.discordVerifier : "",
      // For torus only
      walletAuthConnectionId: currentConfigEnv.walletDiscordVerifier,
    } as AuthConnectionConfigItem,
    {
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.lineVerifier,
      authConnection: AUTH_CONNECTION.LINE,
      name: LINE_LOGIN_PROVIDER,
      description: "",
      clientId: currentConfigEnv.lineClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.lineVerifier : "",
      mainOption: false,
      jwtParameters: {
        domain: currentConfigEnv.loginDomain,
        connection: "line",
        prompt: "consent",
      },
      // For torus only
      walletAuthConnectionId: currentConfigEnv.walletLineVerifier,
    } as AuthConnectionConfigItem,
    {
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.redditVerifier,
      authConnection: AUTH_CONNECTION.REDDIT,
      name: REDDIT_LOGIN_PROVIDER,
      description: "",
      clientId: currentConfigEnv.redditClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.redditVerifier : "",
      mainOption: false,
      jwtParameters: {
        domain: currentConfigEnv.loginDomain,
        userIdField: "name",
        connection: "Reddit",
      },
      // For torus only
      walletAuthConnectionId: currentConfigEnv.walletRedditVerifier,
    } as AuthConnectionConfigItem,
    {
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.appleVerifier,
      authConnection: AUTH_CONNECTION.APPLE,
      name: APPLE_LOGIN_PROVIDER,
      description: "",
      clientId: currentConfigEnv.appleClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.appleVerifier : "",
      mainOption: false,
      jwtParameters: {
        domain: currentConfigEnv.loginDomain,
        connection: "apple",
      },
      // For torus only
      walletAuthConnectionId: currentConfigEnv.walletAppleVerifier,
    } as AuthConnectionConfigItem,
    {
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.githubVerifier,
      authConnection: AUTH_CONNECTION.GITHUB,
      description: "",
      name: GITHUB_LOGIN_PROVIDER,
      clientId: currentConfigEnv.githubClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.githubVerifier : "",
      mainOption: false,
      jwtParameters: {
        domain: currentConfigEnv.loginDomain,
        connection: "github",
        isUserIdCaseSensitive: false,
      },
      // For torus only
      walletAuthConnectionId: currentConfigEnv.walletGithubVerifier,
    } as AuthConnectionConfigItem,
    {
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.twitchVerifier,
      authConnection: AUTH_CONNECTION.TWITCH,
      description: "",
      name: TWITCH_LOGIN_PROVIDER,
      clientId: currentConfigEnv.twitchClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.twitchVerifier : "",
      mainOption: false,
      // For torus only
      walletAuthConnectionId: currentConfigEnv.walletTwitchVerifier,
    } as AuthConnectionConfigItem,
    {
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.linkedinVerifier,
      authConnection: AUTH_CONNECTION.LINKEDIN,
      description: "",
      name: LINKEDIN_LOGIN_PROVIDER,
      clientId: currentConfigEnv.linkedinClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.linkedinVerifier : "",
      mainOption: false,
      jwtParameters: {
        domain: currentConfigEnv.loginDomain,
        connection: "linkedin",
      },
      // For torus only
      walletAuthConnectionId: currentConfigEnv.walletLinkedinVerifier,
    } as AuthConnectionConfigItem,
    {
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.wechatVerifier,
      authConnection: AUTH_CONNECTION.WECHAT,
      description: "",
      name: "WeChat",
      clientId: currentConfigEnv.wechatClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.wechatVerifier : "",
      mainOption: false,
      showOnSocialBackupFactor: true,
      jwtParameters: {
        domain: currentConfigEnv.loginDomain,
        connection: "Wechat",
      },
      // For torus only
      walletAuthConnectionId: currentConfigEnv.walletWechatVerifier,
    } as AuthConnectionConfigItem,
    {
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.kakaoVerifier,
      authConnection: AUTH_CONNECTION.KAKAO,
      description: "",
      name: KAKAO_LOGIN_PROVIDER,
      clientId: currentConfigEnv.kakaoClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.kakaoVerifier : "",
      mainOption: false,
      jwtParameters: {
        domain: currentConfigEnv.loginDomain,
        connection: "Kakao",
      },
      // For torus only
      walletAuthConnectionId: currentConfigEnv.walletKakaoVerifier,
    } as AuthConnectionConfigItem,
    {
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.hostedEmailPasswordlessVerifier,
      description: "login.verifier-email-desc",
      authConnection: AUTH_CONNECTION.EMAIL_PASSWORDLESS,
      name: "email",
      clientId: currentConfigEnv.hostedEmailPasswordlessClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.hostedEmailPasswordlessVerifier : "",
      mainOption: false,
      jwtParameters: {
        domain: currentBuildEnv.passwordlessHost,
        userIdField: "name",
        isUserIdCaseSensitive: false,
        flow_type: EMAIL_FLOW.code,
      },
      // For torus only
      walletAuthConnectionId: currentConfigEnv.walletHostedEmailPasswordlessVerifier,
    } as AuthConnectionConfigItem,
    {
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.hostedSmsPasswordlessVerifier,
      description: "login.verifier-sms-desc-2",
      authConnection: AUTH_CONNECTION.SMS_PASSWORDLESS,
      name: "mobile",
      clientId: currentConfigEnv.hostedSmsPasswordlessClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.hostedSmsPasswordlessVerifier : "",
      mainOption: false,
      jwtParameters: {
        domain: currentBuildEnv.passwordlessHost,
        userIdField: "name",
        isVerifierIdCaseSensitive: false,
      },

      // for torus only.
      walletAuthConnectionId: currentConfigEnv.walletHostedSmsPasswordlessVerifier,
    } as AuthConnectionConfigItem,
    {
      authConnectionId: currentConfigEnv.passkeysVerifier,
      description: "login.verifier-webauth-desc",
      authConnection: AUTH_CONNECTION.PASSKEYS,
      name: PASSKEYS_LOGIN_PROVIDER,
      clientId: currentConfigEnv.passkeysClientId,
      mainOption: false,
      // For torus only
      walletAuthConnectionId: "",
    } as AuthConnectionConfigItem,
    {
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.hostedFarcasterVerifier,
      description: "",
      authConnection: AUTH_CONNECTION.FARCASTER,
      name: "Farcaster",
      clientId: currentConfigEnv.hostedFarcasterClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.hostedFarcasterVerifier : "",
      mainOption: false,
      jwtParameters: {
        domain: currentConfigEnv.farcasterLoginDomain,
      },
      // For torus only
      walletAuthConnectionId: "",
    } as AuthConnectionConfigItem,
    {
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.authenticatorVerifier,
      description: "",
      authConnection: AUTH_CONNECTION.AUTHENTICATOR,
      name: AUTHENTICATOR_LOGIN_PROVIDER,
      clientId: currentConfigEnv.authenticatorClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.authenticatorVerifier : "",
      mainOption: false,
      jwtParameters: {
        domain: currentBuildEnv.passwordlessHost,
        userIdField: "name",
        connection: "authenticator",
        isUserIdCaseSensitive: false,
        network,
      },
      // For torus only
      walletAuthConnectionId: "",
    } as AuthConnectionConfigItem,
  ];
};
