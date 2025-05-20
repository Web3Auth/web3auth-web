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
  CONNECTION_STARTED: "connection_started",
  CONNECTION_COMPLETED: "connection_completed",
  CONNECTION_FAILED: "connection_failed",
  AUTHENTICATION_STARTED: "authentication_started",
  AUTHENTICATION_COMPLETED: "authentication_completed",
  AUTHENTICATION_FAILED: "authentication_failed",
  MFA_ENABLEMENT_STARTED: "mfa_enablement_started",
  MFA_ENABLEMENT_COMPLETED: "mfa_enablement_completed",
  MFA_ENABLEMENT_FAILED: "mfa_enablement_failed",
  MFA_MANAGEMENT_STARTED: "mfa_management_started",
  MFA_MANAGEMENT_FAILED: "mfa_management_failed",
  LOGIN_MODAL_OPENED: "login_modal_opened",
  LOGIN_MODAL_CLOSED: "login_modal_closed",
  INSTALLED_EXTERNAL_WALLET_CLICKED: "installed_external_wallet_clicked",
  OTHER_EXTERNAL_WALLET_CLICKED: "other_external_wallet_clicked",
};

export const ANALYTICS_INTEGRATION_TYPE = {
  REACT_HOOKS: "React Hooks",
  VUE_COMPOSABLES: "Vue Composables",
};

export const ANALYTICS_SDK_TYPE = {
  WEB_NO_MODAL: "Web NoModal",
  WEB_MODAL: "Web Modal",
};
