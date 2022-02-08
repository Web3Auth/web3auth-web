import * as React from "react";

interface ModalProps {
  isDark: boolean;
  appLogo: string;
  version: string;
}

// const closeIcon = AllImages.close.image;

export default function Modal(props: ModalProps) {
  const { appLogo } = props;
  //   const web3authIcon = AllImages[`web3auth${isDark ? "-light" : ""}`].image;
  //   const modalClassName = `w3a-modal w3a-modal--hidden${isDark ? "" : " w3a-modal--light"}`;
  return (
    <div id="w3a-modal">
      <h2>{appLogo}</h2>
    </div>
  );
}
