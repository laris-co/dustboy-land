import { atom } from "nanostores";

/*
  Shared state (nanostores) — framework-agnostic, the one store both Astro inline
  scripts and React islands read. This is the "shared state management" layer.
*/

// connected wallet address (null = not connected). Set by the ConnectWallet island,
// readable by any other island that wants to react to identity.
export const wallet = atom<string | null>(null);

// language toggle (TH/EN) — persisted, shared across islands.
export const locale = atom<"th" | "en">("th");
