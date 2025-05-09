import { AnalyticsBrowser } from "@segment/analytics-next";

import { log } from "./loglevel";
import { sdkVersion } from "./utils";

type UserTraits = {
  [key: string]: unknown;
};

type EventProperties = {
  [key: string]: unknown;
};

const SEGMENT_WRITE_KEY = "gGjtk5XxaH2OAIlErcBgydrHpoRZ2hkZ"; // TODO: use the production key

export class Analytics {
  private static instance: Analytics;

  private analytics: AnalyticsBrowser;

  private constructor() {
    this.analytics = new AnalyticsBrowser();
    this.analytics.load({ writeKey: SEGMENT_WRITE_KEY }).catch((error) => {
      log.error("Failed to initialize Analytics", error);
    });
    log.info("Analytics initialized", { sdkVersion });
  }

  public static init(): void {
    if (Analytics.isDisabled()) {
      return;
    }

    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
  }

  public static async identify(userId: string, traits?: UserTraits) {
    if (Analytics.isDisabled()) {
      return;
    }

    try {
      const instance = Analytics.getInstance();
      return instance.analytics.identify(userId, {
        ...traits,
      });
    } catch (error) {
      log.error(`Failed to identify user ${userId}`, error);
    }
  }

  public static async track(event: string, properties?: EventProperties) {
    if (Analytics.isDisabled()) {
      return;
    }

    try {
      const instance = Analytics.getInstance();
      return instance.analytics.track(event, {
        ...properties,
        sdk_version: sdkVersion,
      });
    } catch (error) {
      log.error(`Failed to track event ${event}`, error);
    }
  }

  private static getInstance() {
    if (!Analytics.instance) {
      log.error("Analytics not initialized. Call Analytics.init() first.");
      throw new Error("Analytics not initialized. Call Analytics.init() first.");
    }
    return Analytics.instance;
  }

  private static isDisabled() {
    // disable analytics if the origin is not https
    return window.location && window.location.protocol !== "https:";
  }
}
