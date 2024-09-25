import React, { useEffect, useState } from "react";
import { useWeb3Auth } from "@web3auth/modal-react-hooks";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../context";
import useOptions from "../hooks/useOptions";
import {
  ChainNamespaceType,
  WEB3AUTH_NETWORK_TYPE,
} from "@web3auth/base";

import { Button, Card, ColorPicker, Select, Tabs, Tag, TextField, Toggle } from "./CommonUI";
import { LANGUAGE_TYPE, LOGIN_PROVIDER_TYPE } from "@web3auth/auth";

const AppSettings: React.FC = () => {
  const {
    network,
    chainNamespace,
    chain,
    adapters,
    setNetWork,
    setChainNamespace,
    setChain,
    setAdapters,
    whiteLabel,
    setWhiteLabel,
    loginProviders,
    setLoginProviders,
    loginMethods,
    setLoginMethods,
    walletPlugin,
    setWalletPlugin,
  } = useAppContext();
  const { t } = useTranslation();
  const { status, logout, isConnected, isInitialized, connect } = useWeb3Auth();

  const { networkOptions, chainNamespaceOptions, chainOptions, adapterOptions, loginProviderOptions, languageOptions } = useOptions();

  const [activeTab, setActiveTab] = useState("General");

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  const onChangeAdapters = (value: string[]) => {
    const [adapter] = value;

    if (adapters.includes(adapter)) {
      setAdapters(adapters.filter((x) => x !== adapter));
    } else {
      setAdapters(adapters.concat(adapter));
    }
  };

  const onChangeLoginProviders = (value: string[]) => {
    const [loginProvider] = value;

    if (loginProviders.includes(loginProvider as LOGIN_PROVIDER_TYPE)) {
      setLoginProviders(loginProviders.filter((x) => x !== loginProvider));
    } else {
      setLoginProviders(loginProviders.concat(loginProvider as LOGIN_PROVIDER_TYPE));
    }
  };

  const onChangeLoginMethods = (loginProvider: LOGIN_PROVIDER_TYPE, fieldName: string, value: string) => {
    const method = loginMethods[loginProvider];
    switch (fieldName) {
      case "name":
        setLoginMethods({ ...loginMethods, [loginProvider]: { ...method, name: value } });
        break;
      case "description":
        setLoginMethods({ ...loginMethods, [loginProvider]: { ...method, description: value } });
        break;
      case "logoHover":
        setLoginMethods({ ...loginMethods, [loginProvider]: { ...method, logoHover: value } });
        break;
      case "logoLight":
        setLoginMethods({ ...loginMethods, [loginProvider]: { ...method, logoLight: value } });
        break;
      case "logoDark":
        setLoginMethods({ ...loginMethods, [loginProvider]: { ...method, logoDark: value } });
        break;
      case "mainOption":
        setLoginMethods({ ...loginMethods, [loginProvider]: { ...method, mainOption: !method.mainOption } });
        break;
      case "showOnModal":
        setLoginMethods({ ...loginMethods, [loginProvider]: { ...method, showOnModal: !method.showOnModal } });
        break;
      case "showOnDesktop":
        setLoginMethods({ ...loginMethods, [loginProvider]: { ...method, showOnDesktop: !method.showOnDesktop } });
        break;
      case "showOnMobile":
        setLoginMethods({ ...loginMethods, [loginProvider]: { ...method, showOnMobile: !method.showOnMobile } });
        break;
      default:
        break;
    }
  };

  const onToggle = (fieldName: string) => {
    switch (fieldName) {
      case "whiteLabel.enable":
        setWhiteLabel({ enable: !whiteLabel.enable, config: whiteLabel.config });
        break;
      case "whiteLabel.config.useLogoLoader":
        setWhiteLabel({ enable: whiteLabel.enable, config: { ...whiteLabel.config, useLogoLoader: !whiteLabel.config.useLogoLoader } });
        break;
      case "walletPlugin.enable":
        setWalletPlugin({ enable: !walletPlugin.enable, logoLight: walletPlugin.logoLight, logoDark: walletPlugin.logoDark });
        break;
      default:
        break;
    }
  };

  const onTextFieldChange = (fieldName: string, value: string) => {
    switch (fieldName) {
      case "whiteLabel.config.appName":
        setWhiteLabel({ enable: whiteLabel.enable, config: { ...whiteLabel.config, appName: value } });
        break;
      case "whiteLabel.config.appUrl":
        setWhiteLabel({ enable: whiteLabel.enable, config: { ...whiteLabel.config, appUrl: value } });
        break;
      case "whiteLabel.config.logoLight":
        setWhiteLabel({ enable: whiteLabel.enable, config: { ...whiteLabel.config, logoLight: value } });
        break;
      case "whiteLabel.config.logoDark":
        setWhiteLabel({ enable: whiteLabel.enable, config: { ...whiteLabel.config, logoDark: value } });
        break;
      case "walletPlugin.logoLight":
        setWalletPlugin({ enable: walletPlugin.enable, logoLight: value, logoDark: walletPlugin.logoDark });
        break;
      case "walletPlugin.logoDark":
        setWalletPlugin({ enable: walletPlugin.enable, logoLight: walletPlugin.logoLight, logoDark: value });
        break;
      
      default:
        break;
    }
  };

  const onChangLanguage = (value: string) => {
    setWhiteLabel({ enable: whiteLabel.enable, config: { ...whiteLabel.config, defaultLanguage: value as LANGUAGE_TYPE } });
  }

  return !isConnected && (
    <div className="grid grid-cols-8 gap-0">
      <div className="col-span-0 sm:col-span-1 lg:col-span-2"></div>
      <Card className="h-auto px-8 py-8 col-span-8 sm:col-span-6 lg:col-span-4">
        <div className="text-3xl font-bold leading-tight text-center">{t("app.greeting")}</div>
        <div className="leading-tight font-extrabold text-center mb-12">
          <Tag text={status} /> 
          &nbsp;
          <Tag text={isInitialized ? "INITIALIZED" : "NOT_INITIALIZE_YET"} />
        </div>
        <Tabs tabs={["General", "WhiteLabel", "Login Provider", "Wallet Plugin"]} activeTab={activeTab} onTabClick={handleTabClick} />
        {activeTab === "General" && (
          <Card className="grid grid-cols-1 gap-2 py-4 px-4 shadow-none">
            <Select
              label={t('app.network')}
              options={networkOptions}
              onChange={(value) => setNetWork(value[0] as WEB3AUTH_NETWORK_TYPE)}
              value={[network]}
            />
            <Select
              label={t('app.chainNamespace')}
              options={chainNamespaceOptions}
              value={[chainNamespace]}
              onChange={(value) => setChainNamespace(value[0] as ChainNamespaceType)}
            />
            <Select label={t('app.chain')} options={chainOptions} value={[chain]} onChange={(value) => setChain(value[0])} />
            <Select label={t('app.adapters')} options={adapterOptions} value={adapters} onChange={onChangeAdapters} multiple={true} />
          </Card>
        )}
        {activeTab === "WhiteLabel" && (
          <Card className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-4 px-4 shadow-none">
            <Toggle label={t("app.whiteLabel.title")} isOn={Boolean(whiteLabel.enable)} onToggle={() => onToggle("whiteLabel.enable")} />
            <Toggle
              label={t("app.whiteLabel.useLogoLoader")}
              isOn={Boolean(whiteLabel.config.useLogoLoader)}
              onToggle={() => onToggle("whiteLabel.config.useLogoLoader")}
              disabled={!whiteLabel.enable}
            />
            <TextField
              label={t("app.whiteLabel.appName")}
              value={whiteLabel.config.appName || ""}
              onChange={(value) => onTextFieldChange("whiteLabel.config.appName", value)}
              disabled={!whiteLabel.enable}
            />
            <Select
              label={t("app.whiteLabel.defaultLanguage")}
              options={languageOptions}
              value={[whiteLabel.config.defaultLanguage || ''] as LANGUAGE_TYPE[]}
              onChange={(value) => onChangLanguage(value[0])}
              disabled={!whiteLabel.enable}
            />
            <TextField className="col-span-2" label={t("app.whiteLabel.appUrl")} value={whiteLabel.config.appUrl || ""} onChange={(value) => {}} disabled={!whiteLabel.enable} />
            <TextField label={t("app.whiteLabel.logoLight")} value={whiteLabel.config.logoLight || ""} onChange={(value) => {}} disabled={!whiteLabel.enable} />
            <TextField label={t("app.whiteLabel.logoDark")} value={whiteLabel.config.logoDark || ""} onChange={(value) => {}} disabled={!whiteLabel.enable}/>
            <ColorPicker label={t("app.whiteLabel.primary")} color={whiteLabel.config.theme?.primary || ""} onChange={(color) => {}} disabled={!whiteLabel.enable} />
            <ColorPicker label={t("app.whiteLabel.primaryColor")} color={whiteLabel.config.theme?.onPrimary || ""} onChange={(color) => {}} disabled={!whiteLabel.enable} />
          </Card>
        )}
        {activeTab === "Login Provider" && (
          <Card className="grid grid-cols-1 gap-2 py-4 px-4 shadow-none">
            <Select
              label={t('app.loginProvider')}
              options={loginProviderOptions}
              value={loginProviders}
              onChange={onChangeLoginProviders}
              multiple={true}
            />
            {loginProviders.map((p, index) => {
              const method = loginMethods[p];
              const { name, description, logoHover, logoLight, logoDark, mainOption, showOnModal, showOnDesktop, showOnMobile } = method;
              return (
                <Card key={index} className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-2 shadow-none border">
                  <div className="font-bold leading-tight text-left sm:col-span-2">{p}</div>
                  <Toggle label={t("app.loginProvider.mainOption")} isOn={mainOption} onToggle={() => onChangeLoginMethods(p, "mainOption", "")} />
                  <TextField label={t("app.loginProvider.name")} value={name} onChange={(value) => onChangeLoginMethods(p, "name", value)} />
                  <TextField
                    label={t("app.loginProvider.description")}
                    value={description}
                    onChange={(value) => onChangeLoginMethods(p, "description", value)}
                  />
                  <TextField
                    label={t("app.loginProvider.logoHover")}
                    value={logoHover}
                    onChange={(value) => onChangeLoginMethods(p, "logoHover", value)}
                  />
                  <TextField
                    label={t("app.loginProvider.logoLight")}
                    value={logoLight}
                    onChange={(value) => onChangeLoginMethods(p, "logoLight", value)}
                  />
                  <TextField
                    label={t("app.loginProvider.logoDark")}
                    value={logoDark}
                    onChange={(value) => onChangeLoginMethods(p, "logoDark", value)}
                  />

                  <Toggle label={t("app.loginProvider.showOnModal")} isOn={showOnModal} onToggle={() => onChangeLoginMethods(p, "showOnModal", "")} />
                  <Toggle
                    label={t("app.loginProvider.showOnDesktop")}
                    isOn={showOnDesktop}
                    onToggle={() => onChangeLoginMethods(p, "showOnDesktop", "")}
                  />
                  <Toggle
                    label={t("app.loginProvider.showOnMobile")}
                    isOn={showOnMobile}
                    onToggle={() => onChangeLoginMethods(p, "showOnMobile", "")}
                  />
                </Card>
              );
            })}
          </Card>
        )}
        {activeTab === "Wallet Plugin" && (
          <Card className="grid grid-cols-1 gap-2 py-4 px-4 shadow-none">
            <Toggle label={t("app.walletPlugin.enable")} isOn={Boolean(walletPlugin.enable)} onToggle={() => onToggle("walletPlugin.enable")} />
            <TextField
              label={t("app.walletPlugin.logoLight")}
              value={walletPlugin.logoLight || ""}
              onChange={(value) => onTextFieldChange("walletPlugin.logoLight", value)}
              disabled={!walletPlugin.enable}
            />
            <TextField
              label={t("app.walletPlugin.logoDark")}
              value={walletPlugin.logoDark || ""}
              onChange={(value) => onTextFieldChange("walletPlugin.logoDark", value)}
              disabled={!walletPlugin.enable}
            />
          </Card>
        )}
        <div className="flex justify-center">
          <Button onClick={connect} className="w-full !h-auto group py-3 rounded-full flex items-center justify-center">
            Connect
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AppSettings;
