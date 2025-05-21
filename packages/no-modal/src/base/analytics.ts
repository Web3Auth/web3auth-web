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

  private enabled: boolean = false;

  public init(): void {
    if (this.segment) {
      throw new Error("Analytics already initialized");
    }

    this.segment = new AnalyticsBrowser();
    this.segment
      .load(
        { writeKey: SEGMENT_WRITE_KEY },
        {
          user: {
            cookie: { key: "web3auth_ajs_user_id" },
            localStorage: { key: "web3auth_ajs_user_traits" },
          },
          globalAnalyticsKey: "web3auth_analytics",
        }
      )
      .then(() => {
        log.debug("Analytics initialized", { sdkVersion });
        return true;
      })
      .catch((error) => {
        log.error("Failed to initialize Analytics", error);
      });
  }

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
  }

  public setGlobalProperties(properties: Record<string, unknown>) {
    this.globalProperties = { ...this.globalProperties, ...properties };
  }

  public async identify(userId: string, traits?: UserTraits) {
    if (!this.enabled) return;
    try {
      return this.getSegment().identify(userId, {
        ...traits,
      });
    } catch (error) {
      log.error(`Failed to identify user ${userId} in analytics`, error);
    }
  }

  public async track(event: string, properties?: EventProperties) {
    if (!this.enabled) return;
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
  SDK_INITIALIZATION_STARTED: "SDK Initialization Started",
  SDK_INITIALIZATION_COMPLETED: "SDK Initialization Completed",
  SDK_INITIALIZATION_FAILED: "SDK Initialization Failed",
  CONNECTION_STARTED: "Connection Started",
  CONNECTION_COMPLETED: "Connection Completed",
  CONNECTION_FAILED: "Connection Failed",
  IDENTITY_TOKEN_STARTED: "Identity Token Started",
  IDENTITY_TOKEN_COMPLETED: "Identity Token Completed",
  IDENTITY_TOKEN_FAILED: "Identity Token Failed",
  MFA_ENABLEMENT_STARTED: "MFA Enablement Started",
  MFA_ENABLEMENT_COMPLETED: "MFA Enablement Completed",
  MFA_ENABLEMENT_FAILED: "MFA Enablement Failed",
  MFA_MANAGEMENT_STARTED: "MFA Management Started",
  MFA_MANAGEMENT_FAILED: "MFA Management Failed",
  LOGIN_MODAL_OPENED: "Login Modal Opened",
  LOGIN_MODAL_CLOSED: "Login Modal Closed",
  EXTERNAL_WALLET_LIST_EXPANDED: "External Wallets List Expanded",
  SOCIAL_LOGIN_SELECTED: "Social Login Selected",
  EXTERNAL_WALLET_SELECTED: "External Wallet Selected",
};

export const ANALYTICS_INTEGRATION_TYPE = {
  REACT_HOOKS: "React Hooks",
  VUE_COMPOSABLES: "Vue Composables",
};

export const ANALYTICS_SDK_TYPE = {
  WEB_NO_MODAL: "Web NoModal",
  WEB_MODAL: "Web Modal",
};
