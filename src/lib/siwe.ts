import { recoverMessageAddress, isAddress, getAddress } from "viem";
import { SignJWT, jwtVerify } from "jose";

// Real Sign-In With Ethereum (EIP-4361) for a static-on-Cloudflare site.
// Signature recovery via viem; stateless session + nonce as short JWTs (jose), in httpOnly cookies.
export const DOMAIN = "dustboy.buildwithoracle.com";
export const CHAIN_ID = 20260619;
export const SESSION_COOKIE = "siwe_session";
export const NONCE_COOKIE = "siwe_nonce";
export const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days
export const NONCE_TTL = 60 * 10; // 10 min

// owner address (public) — gets the founder tier in per-address content
export const OWNER = "0xef1530e49b13341828664f298e683349ad784333";

function secret(env?: Record<string, string>): Uint8Array {
  const s = env?.SESSION_SECRET || "dev-insecure-secret-change-me-in-prod";
  return new TextEncoder().encode(s);
}

export function randomNonce(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

// the exact EIP-4361 message string the client must build + sign (keep in sync with the island)
export function siweMessage(address: string, nonce: string, uri: string, issuedAt: string): string {
  return `${DOMAIN} wants you to sign in with your Ethereum account:\n${address}\n\nSign in to DustBoy PhD Oracle.\n\nURI: ${uri}\nVersion: 1\nChain ID: ${CHAIN_ID}\nNonce: ${nonce}\nIssued At: ${issuedAt}`;
}

export function parseSiwe(msg: string) {
  return {
    address: msg.split("\n")[1]?.trim(),
    nonce: /Nonce: (.+)/.exec(msg)?.[1]?.trim(),
    issuedAt: /Issued At: (.+)/.exec(msg)?.[1]?.trim(),
  };
}

// recover the signer and confirm it matches the address claimed in the message
export async function verifySiwe(message: string, signature: `0x${string}`): Promise<string | null> {
  const { address } = parseSiwe(message);
  if (!address || !isAddress(address)) return null;
  try {
    const recovered = await recoverMessageAddress({ message, signature });
    if (getAddress(recovered) !== getAddress(address)) return null;
    return getAddress(address);
  } catch {
    return null;
  }
}

export async function makeSession(address: string, env?: Record<string, string>): Promise<string> {
  return new SignJWT({ sub: address }).setProtectedHeader({ alg: "HS256" }).setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`).sign(secret(env));
}
export async function readSession(token?: string, env?: Record<string, string>): Promise<string | null> {
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, secret(env)); return (payload.sub as string) ?? null; }
  catch { return null; }
}
export async function makeNonceToken(nonce: string, env?: Record<string, string>): Promise<string> {
  return new SignJWT({ nonce }).setProtectedHeader({ alg: "HS256" }).setIssuedAt()
    .setExpirationTime(`${NONCE_TTL}s`).sign(secret(env));
}
export async function readNonceToken(token?: string, env?: Record<string, string>): Promise<string | null> {
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, secret(env)); return (payload.nonce as string) ?? null; }
  catch { return null; }
}

export function getCookie(request: Request, name: string): string | undefined {
  return request.headers.get("cookie")?.match(new RegExp(`(?:^|; )${name}=([^;]+)`))?.[1];
}
export function setCookie(name: string, value: string, maxAge: number): string {
  return `${name}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}
export function envOf(locals: unknown): Record<string, string> | undefined {
  return (locals as { runtime?: { env?: Record<string, string> } })?.runtime?.env;
}
