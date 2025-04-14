import { Web3AuthNoModal } from "../../../noModal";
import { useWeb3AuthInner } from "./useWeb3AuthInner";

export interface IUseWeb3Auth {
  web3Auth: Web3AuthNoModal;
}

export const useWeb3Auth = (): IUseWeb3Auth => {
  const context = useWeb3AuthInner();
  return context;
};
