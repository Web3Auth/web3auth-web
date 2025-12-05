export const CONNECTOR_STATUS = {
  NOT_READY: "not_ready",
  READY: "ready",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTING: "disconnecting",
  DISCONNECTED: "disconnected",
  ERRORED: "errored",
  AUTHORIZED: "authorized",
  AUTHORIZING: "authorizing",
} as const;

export const CONNECTOR_EVENTS = {
  ...CONNECTOR_STATUS,
  CONNECTOR_DATA_UPDATED: "connector_data_updated",
  CACHE_CLEAR: "cache_clear",
  CONNECTORS_UPDATED: "connectors_updated",
  MFA_ENABLED: "mfa_enabled",
  REHYDRATION_ERROR: "rehydration_error",
} as const;

export const CONNECTOR_CATEGORY = {
  EXTERNAL: "external",
  IN_APP: "in_app",
} as const;

export const CONNECTOR_INITIAL_AUTHENTICATION_MODE = {
  CONNECT_ONLY: "connect-only",
  CONNECT_AND_SIGN: "connect-and-sign",
} as const;
