import { AUTH_CONNECTION, AUTH_CONNECTION_TYPE } from "@web3auth/auth";
import { WalletInitializationError } from "@web3auth/no-modal";

const EMAIL_TEST_ACCOUNT_PREFIX = "test_account_";
const EMAIL_TEST_ACCOUNT_POSTFIX = "@example.com";
const PHONE_TEST_ACCOUNT_PREFIX = "+1-555";

export const isTestAccountPattern = (authConnection: AUTH_CONNECTION_TYPE, loginHint: string) => {
  if (authConnection === AUTH_CONNECTION.EMAIL_PASSWORDLESS) {
    return loginHint.startsWith(EMAIL_TEST_ACCOUNT_PREFIX) && loginHint.endsWith(EMAIL_TEST_ACCOUNT_POSTFIX);
  } else if (authConnection === AUTH_CONNECTION.SMS_PASSWORDLESS) {
    return loginHint.startsWith(PHONE_TEST_ACCOUNT_PREFIX);
  }
  throw WalletInitializationError.invalidParams(`Unsupported auth connection: ${authConnection}`);
};
