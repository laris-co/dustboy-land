import type { APIRoute } from "astro";
import { setCookie, SESSION_COOKIE } from "../../lib/siwe";

export const prerender = false;

export const POST: APIRoute = async () =>
  new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json", "set-cookie": setCookie(SESSION_COOKIE, "", 0) },
  });
