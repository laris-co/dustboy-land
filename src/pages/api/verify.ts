import type { APIRoute } from "astro";
import {
  verifySiwe, parseSiwe, readNonceToken, makeSession, getCookie, setCookie, envOf,
  NONCE_COOKIE, SESSION_COOKIE, SESSION_TTL,
} from "../../lib/siwe";

export const prerender = false;

const json = (o: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...extra } });

export const POST: APIRoute = async ({ request, locals }) => {
  const env = envOf(locals);
  const body = await request.json().catch(() => ({}));
  const { message, signature } = body as { message?: string; signature?: `0x${string}` };
  if (!message || !signature) return json({ ok: false, error: "missing message/signature" }, 400);

  // nonce must match the one we issued (replay protection)
  const expected = await readNonceToken(getCookie(request, NONCE_COOKIE), env);
  const { nonce } = parseSiwe(message);
  if (!expected || !nonce || nonce !== expected) return json({ ok: false, error: "bad-or-expired-nonce" }, 401);

  const address = await verifySiwe(message, signature);
  if (!address) return json({ ok: false, error: "bad-signature" }, 401);

  const session = await makeSession(address, env);
  // set session, clear the used nonce
  const headers = new Headers({ "content-type": "application/json", "cache-control": "no-store" });
  headers.append("set-cookie", setCookie(SESSION_COOKIE, session, SESSION_TTL));
  headers.append("set-cookie", setCookie(NONCE_COOKIE, "", 0));
  return new Response(JSON.stringify({ ok: true, address }), { headers });
};
