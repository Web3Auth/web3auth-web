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
  const [number, setUserNumber] = useState<string>("");
  const [isValidNumber, setValidNumber] = useState<boolean>(false);

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
        <select
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
        />

        <button disabled={!isValidNumber} className="w-full w3a-button" type="submit">
          {t("modal.social.email-continue")}
        </button>
      </form>
    </div>
  );
}
