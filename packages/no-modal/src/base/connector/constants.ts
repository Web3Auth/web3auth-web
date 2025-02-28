export const CONNECTOR_STATUS = {
  NOT_READY: "not_ready",
  READY: "ready",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERRORED: "errored",
} as const;

export const CONNECTOR_EVENTS = {
  ...CONNECTOR_STATUS,
  CONNECTOR_DATA_UPDATED: "connector_data_updated",
  CACHE_CLEAR: "cache_clear",
  CONNECTORS_UPDATED: "connectors_updated",
} as const;

export const CONNECTOR_CATEGORY = {
  EXTERNAL: "external",
  IN_APP: "in_app",
} as const;
