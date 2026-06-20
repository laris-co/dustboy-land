import type { APIRoute } from "astro";
import { randomNonce, makeNonceToken, setCookie, envOf, NONCE_COOKIE, NONCE_TTL } from "../../lib/siwe";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const env = envOf(locals);
  const nonce = randomNonce();
  const token = await makeNonceToken(nonce, env);
  return new Response(JSON.stringify({ nonce }), {
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "set-cookie": setCookie(NONCE_COOKIE, token, NONCE_TTL),
    },
  });
};
