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
  private segment: AnalyticsBrowser;

  private globalProperties: Record<string, unknown> = {};

  public init(): void {
    if (this.segment) {
      throw new Error("Analytics already initialized");
    }

    this.segment = new AnalyticsBrowser();
    this.segment
      .load({ writeKey: SEGMENT_WRITE_KEY })
      .then(() => {
        log.debug("Analytics initialized", { sdkVersion });
        return true;
      })
      .catch((error) => {
        log.error("Failed to initialize Analytics", error);
      });
  }

  public setGlobalProperties(properties: Record<string, unknown>) {
    this.globalProperties = { ...this.globalProperties, ...properties };
  }

  public async identify(userId: string, traits?: UserTraits) {
    try {
      return this.getSegment().identify(userId, {
        ...traits,
      });
    } catch (error) {
      log.error(`Failed to identify user ${userId} in analytics`, error);
    }
  }

  public async track(event: string, properties?: EventProperties) {
    try {
      return this.getSegment().track(event, {
        ...this.globalProperties,
        ...properties,
        sdk_version: sdkVersion,
      });
    } catch (error) {
      log.error(`Failed to track event ${event}`, error);
    }
  }

  private getSegment() {
    if (!this.segment) {
      log.error("Analytics not initialized. Call Analytics.init() first.");
      throw new Error("Analytics not initialized. Call Analytics.init() first.");
    }
    return this.segment;
  }
}

export const ANALYTICS_EVENTS = {
  SDK_INITIALIZATION_COMPLETED: "sdk_initialization_completed",
  SDK_INITIALIZATION_FAILED: "sdk_initialization_failed",
  CONNECT_STARTED: "connect_started",
  CONNECT_COMPLETED: "connect_completed",
  CONNECT_FAILED: "connect_failed",
};

export const ANALYTICS_INTEGRATION_TYPE = {
  REACT_HOOKS: "React Hooks",
  VUE_COMPOSABLES: "Vue Composables",
};

export const ANALYTICS_SDK_TYPE = {
  WEB_NO_MODAL: "Web NoModal",
  WEB_MODAL: "Web Modal",
};
