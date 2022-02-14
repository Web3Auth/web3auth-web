import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import Web3AuthProvider from "./components/Web3AuthProvider";

ReactDOM.render(
  <React.StrictMode>
    <Web3AuthProvider>
      <App />
    </Web3AuthProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
