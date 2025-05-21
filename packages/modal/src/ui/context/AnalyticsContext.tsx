import { type Analytics } from "@web3auth/no-modal";
import { createContext } from "react";

export const AnalyticsContext = createContext<{
  analytics?: Analytics;
}>({
  analytics: undefined,
});
