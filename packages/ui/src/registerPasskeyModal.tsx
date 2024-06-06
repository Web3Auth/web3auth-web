import "../css/web3auth.css";

import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { createRoot } from "react-dom/client";

import RegisterPasskey from "./components/RegisterPasskey";
import { ThemedContext } from "./context/ThemeContext";
import { UIConfig } from "./interfaces";
import { getUserLanguage } from "./utils";

function createWrapper(parentZIndex = "20"): HTMLElement {
  const existingWrapper = document.getElementById("w3a-parent-container");
  if (existingWrapper) existingWrapper.remove();

  const parent = document.createElement("section");
  parent.classList.add("w3a-parent-container");
  parent.setAttribute("id", "w3a-parent-container");
  parent.style.zIndex = parentZIndex;
  parent.style.position = "relative";
  const wrapper = document.createElement("section");
  wrapper.setAttribute("id", "w3a-container");
  parent.appendChild(wrapper);
  document.body.appendChild(parent);
  return wrapper;
}

class RegisterPasskeyModal extends SafeEventEmitter {
  isDark = true;

  private uiConfig: UIConfig;

  constructor(uiConfig: UIConfig) {
    super();
    this.uiConfig = uiConfig;
    if (!uiConfig.mode) this.uiConfig.mode = "light";
    if (!uiConfig.defaultLanguage) this.uiConfig.defaultLanguage = getUserLanguage(uiConfig.defaultLanguage);
  }

  initModal = (): void => {
    const darkState = { isDark: this.isDark };
    const container = createWrapper();
    if (darkState.isDark) {
      container.classList.add("dark");
    } else {
      container.classList.remove("dark");
    }

    const root = createRoot(container);

    root.render(
      <ThemedContext.Provider value={darkState}>
        <RegisterPasskey />
      </ThemedContext.Provider>
    );
  };
}

export default RegisterPasskeyModal;
