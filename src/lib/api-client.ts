import { getCurrentMember } from "./auth";

/** 認証ヘッダー付きの fetch。ログイン中なら x-member-id を自動付与。 */
export function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const member = getCurrentMember();
  const headers = new Headers(init?.headers);
  if (member) {
    headers.set("x-member-id", member.id);
  }
  return fetch(input, { ...init, headers });
}
