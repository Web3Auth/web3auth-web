import "../css/web3auth.css";

import * as React from "react";
import * as ReactDOM from "react-dom";

import Modal from "./components/Modal";
function renderWrapper(): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("id", "w3a-container");
  document.body.appendChild(wrapper);
  return wrapper;
}

export default function open() {
  const wrapper = renderWrapper();
  ReactDOM.render(
    <Modal
      externalWalletConfig={{
        metamask: {
          label: "Metamask",
        },
      }}
      loginMethods={{
        google: {
          name: "google",
        },
        facebook: {
          name: "facebook",
        },
      }}
      isDark={false}
      appLogo="https://cryptologos.cc/logos/solana-sol-logo.svg"
      version="1"
    />,
    wrapper
  );
}

open();
