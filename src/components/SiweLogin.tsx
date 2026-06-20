import { useEffect, useState } from "react";

type Content = { title: string; body: string; links: { label: string; href: string }[] };
type Me = { authed: boolean; address?: string; tier?: string; content?: Content };

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export default function SiweLogin() {
  const [me, setMe] = useState<Me | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    try {
      const r = await fetch("/api/me", { credentials: "same-origin" });
      setMe(await r.json());
    } catch {
      setMe({ authed: false });
    }
  }
  useEffect(() => { refresh(); }, []);

  async function signIn() {
    setErr(null);
    const eth = window.ethereum;
    if (!eth?.request) { setErr("ไม่พบ wallet (เช่น MetaMask)"); return; }
    setBusy(true);
    try {
      const accts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      const address = accts[0];
      const { nonce } = await fetch("/api/nonce", { credentials: "same-origin" }).then((r) => r.json());
      const issuedAt = new Date().toISOString();
      const message =
        `dustboy.buildwithoracle.com wants you to sign in with your Ethereum account:\n${address}\n\n` +
        `Sign in to DustBoy PhD Oracle.\n\nURI: ${location.origin}\nVersion: 1\nChain ID: 20260619\n` +
        `Nonce: ${nonce}\nIssued At: ${issuedAt}`;
      const signature = (await eth.request({ method: "personal_sign", params: [message, address] })) as string;
      const res = await fetch("/api/verify", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, signature }),
      }).then((r) => r.json());
      if (!res.ok) setErr("ยืนยันไม่สำเร็จ: " + (res.error || ""));
      else await refresh();
    } catch {
      setErr("ยกเลิก หรือลงชื่อไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
    await refresh();
  }

  if (me === null) return <p className="text-muted">กำลังโหลด…</p>;

  if (!me.authed) {
    return (
      <div>
        <button
          type="button" onClick={signIn} disabled={busy}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-accent px-4 text-sm font-600 text-accent-ink transition hover:brightness-110 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
        >
          {busy ? "กำลังลงชื่อ…" : "Sign in with Ethereum"}
        </button>
        {err && <p role="alert" aria-live="assertive" className="mt-2 text-sm" style={{ color: "var(--color-ember)" }}>{err}</p>}
        <p className="mt-3 max-w-md text-sm text-muted">
          เซ็นข้อความด้วย wallet เพื่อพิสูจน์ว่าเป็นเจ้าของ address — เว็บไม่เคยเห็น private key (เซ็นฝั่ง client ล้วน)
        </p>
      </div>
    );
  }

  const c = me.content!;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex min-h-9 items-center rounded-full border border-border-strong bg-surface px-3 font-mono text-xs text-ink">{short(me.address!)}</span>
        <span className="inline-flex min-h-9 items-center rounded-full border border-accent px-2.5 font-mono text-[11px] text-accent">{me.tier}</span>
        <button type="button" onClick={signOut} className="cursor-pointer text-sm text-muted underline underline-offset-2 hover:text-ink">ออกจากระบบ</button>
      </div>
      <div className="mt-6 rounded-xl border border-border bg-surface/40 p-6">
        <h2 className="font-display text-2xl text-ink">{c.title}</h2>
        <p className="mt-2 leading-relaxed text-muted">{c.body}</p>
        <ul className="mt-4 flex flex-col gap-2">
          {c.links.map((l) => (
            <li key={l.href}><a href={l.href} className="text-accent hover:underline">{l.label} →</a></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
