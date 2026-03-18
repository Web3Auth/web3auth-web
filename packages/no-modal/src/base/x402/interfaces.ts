export type X402SiweAuthResponse = {
  token: string;
  accountId: string;
  expiresAt: string;
};

export type MethodProtocol = "JSON-RPC" | "REST";

export type Method = {
  id: string;
  name: string;
  description: string;
  protocol: MethodProtocol;
  network: string;
  networkDisplay: string;
  rpcMethod?: string;
  rpcParams?: unknown[];
  restPath?: string;
  restMethod?: "GET" | "POST";
};

export type MethodExecutionResult = {
  id: string;
  methodId: string;
  methodName: string;
  network: string;
  networkDisplay: string;
  protocol: MethodProtocol;
  status: number;
  ok: boolean;
  requestedAt: string;
  data: unknown;
  error?: string;
  paymentResponse?: unknown;
};
