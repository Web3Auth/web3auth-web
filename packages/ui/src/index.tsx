import "../css/web3auth.css";

import * as React from "react";
import * as ReactDOM from "react-dom";

import Modal from "./components/Modal";

export default function ExternalWallet() {
  return (
    <div>
      <Modal isDark={false} appLogo="sksk" version="1" />
    </div>
  );
}

function renderWrapper(): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("id", "w3a-modal");
  document.body.appendChild(wrapper);
  return wrapper;
}

export function open() {
  const wrapper = renderWrapper();
  ReactDOM.render(<ExternalWallet />, wrapper);
}

open();
