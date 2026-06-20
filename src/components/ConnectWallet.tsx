import { useEffect, useState } from "react";
import { wallet } from "../stores/ui";

/*
  Connect Wallet — client-side only (EIP-1193 window.ethereum).
  The site NEVER touches a private key: the user approves connect + sign in their
  own wallet. Optional SIWE-style personal_sign proves identity without a password.
  Writes the address into the shared nanostore so other islands can react.
*/
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export default function ConnectWallet() {
  const [addr, setAddr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth?.request) return;
    eth.request({ method: "eth_accounts" })
      .then((a) => {
        const acc = (a as string[])?.[0] ?? null;
        if (acc) { setAddr(acc); wallet.set(acc); }
      })
      .catch(() => {});
  }, []);

  async function connect() {
    setErr(null);
    const eth = window.ethereum;
    if (!eth?.request) {
      setErr("ไม่พบ wallet (เช่น MetaMask)");
      return;
    }
    setBusy(true);
    try {
      const a = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      const acc = a?.[0] ?? null;
      setAddr(acc);
      wallet.set(acc);
    } catch {
      setErr("ยกเลิกการเชื่อมต่อ");
    } finally {
      setBusy(false);
    }
  }

  // SIWE-style proof of ownership — personal_sign, no key ever leaves the wallet.
  async function sign() {
    const eth = window.ethereum;
    if (!eth?.request || !addr) return;
    setBusy(true);
    setErr(null);
    try {
      const msg = `dustboy.buildwithoracle.com wants you to sign in.\nAddress: ${addr}\nIssued At: ${new Date().toISOString()}`;
      await eth.request({ method: "personal_sign", params: [msg, addr] });
      setSigned(true);
    } catch {
      setErr("ยกเลิกการเซ็น");
    } finally {
      setBusy(false);
    }
  }

  const alert = err ? (
    <p role="alert" aria-live="assertive"
      className="absolute right-0 top-full z-50 mt-1 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs"
      style={{ color: "var(--color-ember)" }}>{err}</p>
  ) : null;

  if (addr) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={sign}
          disabled={busy}
          aria-busy={busy}
          aria-label={signed ? `เชื่อมต่อแล้ว ${short(addr)} · ยืนยันตัวตนแล้ว` : `เชื่อมต่อแล้ว ${short(addr)} · คลิกเพื่อเซ็นยืนยันตัวตน`}
          title={signed ? "ยืนยันตัวตนแล้ว (SIWE)" : "คลิกเพื่อเซ็นยืนยันตัวตน (SIWE)"}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md border border-border-strong bg-surface px-2.5 font-mono text-xs text-ink transition-colors hover:border-accent active:bg-surface-2 disabled:cursor-wait disabled:opacity-70"
        >
          <span aria-hidden="true" style={{ color: signed ? "var(--color-accent)" : "var(--color-ember)" }}>{signed ? "✓" : "○"}</span>
          {short(addr)}
        </button>
        {alert}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={connect}
        disabled={busy}
        aria-busy={busy}
        aria-label="เชื่อมวอลเล็ต"
        className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border-strong bg-surface px-2.5 text-sm font-600 text-ink transition-colors hover:border-accent active:bg-surface-2 disabled:cursor-wait disabled:opacity-70"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="6" width="18" height="13" rx="2.5" stroke="currentColor" stroke-width="1.8" />
          <path d="M16.5 12.5h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
        </svg>
        <span className="hidden md:inline">{busy ? "กำลังเชื่อม…" : "เชื่อมวอลเล็ต"}</span>
      </button>
      {alert}
    </div>
  );
}
