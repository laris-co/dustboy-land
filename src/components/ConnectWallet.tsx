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

  if (addr) {
    return (
      <button
        type="button"
        onClick={sign}
        disabled={busy}
        title={signed ? "ยืนยันตัวตนแล้ว (SIWE)" : "คลิกเพื่อเซ็นยืนยันตัวตน (SIWE)"}
        className="cursor-pointer rounded-md border border-border-strong bg-surface px-2.5 py-1.5 font-mono text-xs text-ink transition-colors hover:border-accent disabled:opacity-50"
      >
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: signed ? "var(--color-accent)" : "var(--color-ember)" }} />
        {short(addr)}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={connect}
      disabled={busy}
      className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-sm font-600 text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {busy ? "กำลังเชื่อม…" : err ?? "Connect Wallet"}
    </button>
  );
}
