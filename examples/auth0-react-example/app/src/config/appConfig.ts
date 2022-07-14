export const APP_CONFIG = {
  SPA: {
    displayName: "SPA",
  },
  RWA: {
    displayName: "RWA",
  },
} as const;

export type APP_CONFIG_TYPE = keyof typeof APP_CONFIG;
