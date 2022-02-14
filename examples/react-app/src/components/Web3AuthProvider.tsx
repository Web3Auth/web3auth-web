import { Web3Auth } from "@web3auth/web3auth";
import { CHAIN_NAMESPACES } from "@web3auth/base";
import { createContext, useContext } from "react";

const Web3AuthContext = createContext<Web3Auth | null>(null);

const polygonMumbaiConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  rpcTarget: "https://rpc-mumbai.maticvigil.com",
  blockExplorer: "https://mumbai-explorer.matic.today",
  chainId: "0x13881",
  displayName: "Polygon Mumbai Testnet",
  ticker: "matic",
  tickerName: "matic",
};

const web3auth = new Web3Auth({
  chainConfig: polygonMumbaiConfig,
  clientId: "BKPxkCtfC9gZ5dj-eg-W6yb5Xfr3XkxHuGZl2o2Bn8gKQ7UYike9Dh6c-_LaXlUN77x0cBoPwcSx-IVm0llVsLA",
});

const Web3AuthProvider: React.FC = ({ children }) => {
  return <Web3AuthContext.Provider value={web3auth}>{children}</Web3AuthContext.Provider>;
};

export const useWeb3Auth = () => {
  const web3auth = useContext(Web3AuthContext);
  if (web3auth === null) throw new Error("Must wrap component in Web3AuthProvider");
  return web3auth;
};

export default Web3AuthProvider;
