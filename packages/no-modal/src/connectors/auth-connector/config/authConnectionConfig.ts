import { AUTH_CONNECTION, AuthConnectionConfig, AuthConnectionConfigItem, BUILD_ENV_TYPE, EMAIL_FLOW, WEB3AUTH_NETWORK_TYPE } from "@web3auth/auth";

import { configBuild } from "./config-build";
import { configEnv } from "./config-env";

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
      name: AUTH_CONNECTION.GOOGLE,
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
      name: AUTH_CONNECTION.FACEBOOK,
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
      name: AUTH_CONNECTION.TWITTER,
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
      name: AUTH_CONNECTION.DISCORD,
      description: "",
      clientId: currentConfigEnv.discordClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.discordVerifier : "",
      // For torus only
      walletAuthConnectionId: currentConfigEnv.walletDiscordVerifier,
    } as AuthConnectionConfigItem,
    {
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.lineVerifier,
      authConnection: AUTH_CONNECTION.LINE,
      name: AUTH_CONNECTION.LINE,
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
      name: AUTH_CONNECTION.REDDIT,
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
      name: AUTH_CONNECTION.APPLE,
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
      name: AUTH_CONNECTION.GITHUB,
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
      name: AUTH_CONNECTION.TWITCH,
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
      name: AUTH_CONNECTION.LINKEDIN,
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
      name: AUTH_CONNECTION.WECHAT,
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
      name: AUTH_CONNECTION.KAKAO,
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
  ];
};
