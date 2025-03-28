import { safeatob } from '@web3auth/auth';

export function decodeToken<T>(token: string): { header: { alg: string; typ: string; kid?: string }; payload: T } {
  const [header, payload] = token.split(".");
  return {
    header: JSON.parse(safeatob(header)),
    payload: JSON.parse(safeatob(payload)) as T,
  };
}

