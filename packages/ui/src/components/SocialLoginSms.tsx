import { LOGIN_PROVIDER, OPENLOGIN_NETWORK_TYPE } from "@toruslabs/openlogin";
import { log } from "@web3auth/base";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getUserCountry, validatePhoneNumber } from "../utils";

interface SocialLoginSmsProps {
  adapter: string;
  web3AuthNetwork: OPENLOGIN_NETWORK_TYPE;
  handleSocialLoginClick: (params: { adapter: string; loginParams: { loginProvider: string; login_hint?: string; name: string } }) => void;
}
export default function SocialLoginSms(props: SocialLoginSmsProps) {
  const { handleSocialLoginClick, adapter, web3AuthNetwork } = props;
  const [countryData, setCountryData] = useState<Record<string, string>[] | null>(null);
  const [flag, setUserFlag] = useState<string>("");
  const [code, setUserCode] = useState<string>("");
  const [number, setUserNumber] = useState<string>("");
  const [isValidFormattedNumber, setValidFormattedNumber] = useState<boolean | null>(null);
  const [showCountryCodeDropdown, setShowCountryCodeDropdown] = useState<boolean>(false);

  const [t] = useTranslation();

  const handleSmsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!code || !number) return;
    const parsedPhoneNumber = `${code}-${number}`;
    const isNumberValid = await validatePhoneNumber(parsedPhoneNumber, web3AuthNetwork);
    if (!isNumberValid) {
      setValidFormattedNumber(false);
      return;
    }
    handleSocialLoginClick({
      adapter,
      loginParams: { loginProvider: LOGIN_PROVIDER.SMS_PASSWORDLESS, login_hint: parsedPhoneNumber, name: "Mobile" },
    });
  };

  const toggleCountryCodeDropdown = () => {
    setShowCountryCodeDropdown(!showCountryCodeDropdown);
  };

  const selectCountry = (countryDetails: Record<string, string>) => {
    setUserCode(countryDetails.dial_code);
    setUserFlag(countryDetails.flag);
    setShowCountryCodeDropdown(false);
  };

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUserNumber(e.target.value);
    if (isValidFormattedNumber === false) setValidFormattedNumber(null);
  };

  useEffect(() => {
    const importCountryData = async () => {
      try {
        const data = (await import("../helper/countryData")).default;
        setCountryData(data);
      } catch (error: unknown) {
        log.error("error fetching country data", (error as Error).message);
      }
    };

    importCountryData();
  }, []);

  useEffect(() => {
    const getLocation = async () => {
      const result = await getUserCountry(web3AuthNetwork);
      if (result) {
        setUserCode(result.dialCode);
        setUserFlag(result.country);
      }
    };
    if (countryData) getLocation();
  }, [countryData, web3AuthNetwork]);

  return (
    <div className="w3ajs-sms-passwordless w3a-group w3a-group--sms">
      <div className="w3a-group__title">{t("modal.social.sms")}</div>
      <form className="w3ajs-sms-passwordless-form" onSubmit={(e) => handleSmsSubmit(e)}>
        <div className="w3a-sms-field__container">
          <div className="w3a-sms-field__code">
            <button className="w3a-text-field w3a-text-field--country-code" type="button" onClick={toggleCountryCodeDropdown}>
              <div className="w3a-sms-field__code-selected">
                {flag} {code}
              </div>
              <svg
                className="w-4 h-4 ml-2"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className={`w3a-sms-field__code-dropdown ${showCountryCodeDropdown ? "" : "w3a-sms-field__code-dropdown--hidden"}`}>
              <ul>
                {countryData &&
                  countryData.map((i) => {
                    return (
                      <li key={i.code}>
                        <button onClick={() => selectCountry(i)} type="button">
                          {i.code} {i.dial_code}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </div>
          <div className="w3a-sms-field__number">
            <input
              className="w-full mb-4 w3a-text-field w3a-text-field--number"
              type="number"
              name="phone number"
              autoComplete="tel-national"
              required
              placeholder={`${t("modal.social.sms-placeholder-text")}: 9009009009`}
              onFocus={(e) => (e.target.placeholder = "")}
              onBlur={(e) => (e.target.placeholder = `${t("modal.social.sms-placeholder-text")}: 9009009009`)}
              onChange={handleNumberChange}
            />
          </div>
        </div>
        {isValidFormattedNumber === false && <div className="w3a-sms-field--error">{t("modal.social.sms-invalid-number")}</div>}

        <button disabled={!code || !number || isValidFormattedNumber === false} className="w-full w3a-button" type="submit">
          {t("modal.social.sms-continue")}
        </button>
      </form>
    </div>
  );
}
