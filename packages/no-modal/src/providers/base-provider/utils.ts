import getCreateRandomId from "json-rpc-random-id";
export const createRandomId = getCreateRandomId();

export enum EIP1193_EVENTS {
  ACCOUNTS_CHANGED = "accountsChanged",
  CHAIN_CHANGED = "chainChanged",
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  MESSAGE = "message",
}

export { getED25519Key } from "@web3auth/auth";
