import { BUILD_ENV, BUILD_ENV_TYPE } from "@web3auth/auth";
import { LogLevelDesc } from "loglevel";

// Passwordless backend service
export const PASSWORDLESS_SERVER_API_URL = "https://api.web3auth.io/passwordless-service";
export const PASSWORDLESS_SERVER_SOCKET_URL = "https://api-passwordless.web3auth.io";
export const DEVELOP_PASSWORDLESS_SERVER_API_URL = "https://api-develop.web3auth.io/passwordless-service";
export const DEVELOP_PASSWORDLESS_SERVER_SOCKET_URL = "https://api-develop-passwordless.web3auth.io";

// Auth backend service
export const AUTH_SERVER_URL = "https://api.web3auth.io/auth-service";
export const DEVELOP_AUTH_SERVER_URL = "https://api-develop.web3auth.io/auth-service";

export interface ConfigBuild {
  // add discord revoke api in backend
  apiHost: string; // auth backend
  passwordlessBackendHost: string;
  passwordlessHost: string;
  sentrySampleRate: string;
  sentryTransactionSampleRate: string;
  supportsVersioning: boolean;
  logLevel: LogLevelDesc;
}

export const configBuild: Record<BUILD_ENV_TYPE, ConfigBuild> = {
  [BUILD_ENV.DEVELOPMENT]: {
    apiHost: `${DEVELOP_AUTH_SERVER_URL}`,
    logLevel: "debug",
    passwordlessBackendHost: `${DEVELOP_PASSWORDLESS_SERVER_API_URL}/api/v3/`,
    passwordlessHost: "https://develop-passwordless.web3auth.io",
    sentrySampleRate: "0",
    sentryTransactionSampleRate: "0",
    supportsVersioning: false,
  },
  [BUILD_ENV.STAGING]: {
    apiHost: AUTH_SERVER_URL,
    logLevel: "debug",
    passwordlessBackendHost: `${PASSWORDLESS_SERVER_API_URL}/api/v3/`,
    passwordlessHost: "https://staging-passwordless.web3auth.io/v6",
    sentrySampleRate: "0.1",
    sentryTransactionSampleRate: "0.1",
    supportsVersioning: true,
  },
  [BUILD_ENV.PRODUCTION]: {
    apiHost: AUTH_SERVER_URL,
    logLevel: "error",
    passwordlessBackendHost: `${PASSWORDLESS_SERVER_API_URL}/api/v3/`,
    passwordlessHost: "https://passwordless.web3auth.io/v6",
    sentrySampleRate: "0.5",
    sentryTransactionSampleRate: "0.001",
    supportsVersioning: true,
  },
  [BUILD_ENV.TESTING]: {
    apiHost: DEVELOP_AUTH_SERVER_URL,
    logLevel: "debug",
    passwordlessBackendHost: `${DEVELOP_PASSWORDLESS_SERVER_API_URL}/api/v3/`,
    passwordlessHost: "https://develop-passwordless.web3auth.io",
    sentrySampleRate: "1",
    sentryTransactionSampleRate: "0.1",
    supportsVersioning: false,
  },
};
