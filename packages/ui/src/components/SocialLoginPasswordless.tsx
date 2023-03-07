import { LOGIN_PROVIDER, OPENLOGIN_NETWORK_TYPE } from "@toruslabs/openlogin";
import { ChangeEvent, FormEvent, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ThemedContext } from "../context/ThemeContext";
import { getUserCountry, validatePhoneNumber } from "../utils";
import Icon from "./Icon";

interface SocialLoginPasswordlessProps {
  isPrimaryBtn: boolean;
  isEmailVisible: boolean;
  isSmsVisible: boolean;
  adapter: string;
  web3AuthNetwork: OPENLOGIN_NETWORK_TYPE;
  handleSocialLoginClick: (params: { adapter: string; loginParams: { loginProvider: string; login_hint?: string; name: string } }) => void;
}
export default function SocialLoginPasswordless(props: SocialLoginPasswordlessProps) {
  const { handleSocialLoginClick, adapter, web3AuthNetwork, isPrimaryBtn, isEmailVisible, isSmsVisible } = props;
  const { isDark } = useContext(ThemedContext);

  const [fieldValue, setFieldValue] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("");
  const [isValidInput, setIsValidInput] = useState<boolean | null>(null);

  const [t] = useTranslation();

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = fieldValue;
    const isEmailValid = value.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i);
    if (isEmailValid) {
      return handleSocialLoginClick({ adapter, loginParams: { loginProvider: LOGIN_PROVIDER.EMAIL_PASSWORDLESS, login_hint: value, name: "Email" } });
    }
    const number = value.startsWith("+") ? value : `${countryCode}${value}`;
    const result = await validatePhoneNumber(number, web3AuthNetwork);
    if (result) {
      return handleSocialLoginClick({
        adapter,
        loginParams: { loginProvider: LOGIN_PROVIDER.SMS_PASSWORDLESS, login_hint: typeof result === "string" ? result : number, name: "Mobile" },
      });
    }

    setIsValidInput(false);
    return undefined;
  };

  useEffect(() => {
    const getLocation = async () => {
      const result = await getUserCountry(web3AuthNetwork);
      if (result && result.dialCode) {
        setCountryCode(result.dialCode);
      }
    };
    if (isSmsVisible) getLocation();
  }, [isSmsVisible, web3AuthNetwork]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFieldValue(e.target.value);
    if (isValidInput === false) setIsValidInput(null);
  };

  const title = useMemo(() => {
    if (isEmailVisible && isSmsVisible) return "modal.social.passwordless-title";
    if (isEmailVisible) return "modal.social.email";
    return "modal.social.phone";
  }, [isEmailVisible, isSmsVisible]);

  const placeholder = useMemo(() => {
    if (isEmailVisible && isSmsVisible) return "+(00)123456/name@example.com";
    if (isEmailVisible) return "name@example.com";
    return "+(00)123456";
  }, [isEmailVisible, isSmsVisible]);

  return (
    <div className="w3ajs-passwordless w3a-group w3a-group--passwordless">
      <div className="w3a-group__title">
        {t(title)}
        {isSmsVisible && (
          <div className="relative flex flex-col items-center cursor-pointer group">
            <Icon iconName={`information-circle${isDark ? "-light" : ""}`} />
            <div className="absolute z-20 flex-col items-center hidden mb-5 top-4 group-hover:flex">
              <div className="w-3 h-3 ml-[3px] -mb-2 rotate-45 bg-app-gray-50 dark:bg-app-gray-600" />
              <div className="relative p-4 w-[300px] text-xs leading-none text-white rounded-md bg-app-gray-50 dark:bg-app-gray-600 shadow-lg">
                <div className="mb-1 text-xs font-medium text-app-gray-900 dark:text-white">{t("modal.popup.phone-header")}</div>
                <div className="text-xs text-app-gray-400">{t("modal.popup.phone-body")}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      <form className="w3ajs-passwordless-form" onSubmit={(e) => handleFormSubmit(e)}>
        <input
          className="w-full mb-4 w3a-text-field"
          name="passwordless-input"
          required
          placeholder={`${t("modal.social.sms-placeholder-text")} ${placeholder}`}
          onFocus={(e) => (e.target.placeholder = "")}
          onBlur={(e) => (e.target.placeholder = `${t("modal.social.sms-placeholder-text")} ${placeholder}`)}
          onChange={(e) => handleInputChange(e)}
        />

        {isValidInput === false && <div className="w3a-sms-field--error">{t("modal.errors-invalid-number-email")}</div>}

        <button disabled={fieldValue === ""} className={`w3a-button ${isPrimaryBtn ? "w3a-button--primary" : ""} w-full`} type="submit">
          {t("modal.social.passwordless-cta")}
        </button>
      </form>
    </div>
  );
}
