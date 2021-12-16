import { SafeEventEmitterProvider } from "@toruslabs/base-controllers";
import getCreateRandomId from "json-rpc-random-id";
export const createRandomId = getCreateRandomId();

export const sendRpcRequest = async <T, U>(provider: SafeEventEmitterProvider, method: string, params: T): Promise<U> => {
  const resp = await provider.sendAsync<T, U>({
    jsonrpc: "2.0",
    id: createRandomId(),
    method,
    params,
  });
  return resp;
};
