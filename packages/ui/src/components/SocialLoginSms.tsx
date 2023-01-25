import { log } from "@web3auth/base";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getUserCountry } from "../utils";

interface SocialLoginSmsProps {
  adapter: string;
  handleSocialLoginClick: (params: { adapter: string; loginParams: { loginProvider: string; login_hint?: string; name: string } }) => void;
}
export default function SocialLoginSms(props: SocialLoginSmsProps) {
  const { handleSocialLoginClick, adapter } = props;
  const [countryData, setCountryData] = useState<Record<string, string>[] | null>(null);
  const [country, setUserCountry] = useState<string>("");
  const [flag, setUserFlag] = useState<string>("");
  const [code, setUserCode] = useState<string>("");
  const [number, setUserNumber] = useState<string>("");
  const [isValidNumber, setValidNumber] = useState<boolean>(false);
  const [showCountryCodeDropdown, setShowCountryCodeDropdown] = useState<boolean>(false);

  const fetchUserLocation = useCallback(() => {
    const getLocation = async () => {
      const result = await getUserCountry();
      if (country) {
        const match = countryData.find((i) => i.code.toLowerCase() === country.toLowerCase());
        if (match) setUserCountry(country);
      }
      setUserCountry(result);
    };

    if (countryData) getLocation();
  }, [country, countryData, setUserCountry]);

  const [t] = useTranslation();

  const handleSmsSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = ((e.target as HTMLFormElement)[0] as HTMLInputElement).value;
    if (email) handleSocialLoginClick({ adapter, loginParams: { loginProvider: "email_passwordless", login_hint: email, name: "Email" } });
  };

  const toggleCountryCodeDropdown = () => {
    setShowCountryCodeDropdown(!showCountryCodeDropdown);
  };

  const selectCountry = (countryDetails: Record<string, string>) => {
    setUserCode(countryDetails.dial_code);
    setUserFlag(countryDetails.flag);
    setShowCountryCodeDropdown(false);
  };

  useEffect(() => {
    let isCancelled = false;

    const importCountryData = async () => {
      try {
        const data = (await import("../helper/countryData")).default;
        setCountryData(data);
      } catch (error: unknown) {
        log.error("error fetching country data", (error as Error).message);
      }
    };

    if (!isCancelled) {
      importCountryData();
      fetchUserLocation();
    }

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (countryData) fetchUserLocation();
  }, [countryData, fetchUserLocation]);

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
              className="w-full mb-4 w3a-text-field"
              type="email"
              name="email"
              required
              placeholder={`${t("modal.social.sms-placeholder-text")}: 9009009009`}
              onFocus={(e) => (e.target.placeholder = "")}
              onBlur={(e) => (e.target.placeholder = `${t("modal.social.sms-placeholder-text")}: 9009009009`)}
              onChange={(e) => setUserNumber(e.target.value)}
            />
          </div>
        </div>
        {/* <select
          id="country-code"
          onChange={(e) => setUserCountry(e.target.value)}
          className="w3ajs-sms-passwordless-country-code-select w3a-text-field"
        >
          {countryData &&
            countryData.map((i) => {
              return (
                <option key={i.code} value={i.code}>
                  {i.name}
                </option>
              );
            })}
        </select>
        <input
          className="w-full mb-4 w3a-text-field"
          type="email"
          name="email"
          required
          placeholder={t("modal.social.email-new")}
          onFocus={(e) => (e.target.placeholder = "")}
          onBlur={(e) => (e.target.placeholder = t("modal.social.email-new"))}
          onChange={(e) => setUserNumber(e.target.value)}
        /> */}

        <button disabled={!isValidNumber} className="w-full w3a-button" type="submit">
          {t("modal.social.sms-continue")}
        </button>
      </form>
    </div>
  );
}
