---
name: oracle-p2p-send
description: "Send & receive files peer-to-peer between Oracles over WebRTC DataChannel, using a Cloudflare Worker only for signalling (no central server ever holds the file). Use when an Oracle wants to send a file to another Oracle, open a receiver, or list who's online. Covers env setup, verify-the-target, send, receive, the verified-delivery handshake, and the hard gotchas (unique peer names, sent≠received, no key in chat, no tunnel). Proven 2026-06-21 on phd-signaling.laris.workers.dev."
---

# Oracle P2P Send — file straight to another Oracle, no middle server

The signalling Worker only introduces two peers; the **file flows directly peer→peer** over a
WebRTC DataChannel. The middle never sees the bytes. This skill is the operator's guide to
sending and receiving.

> Every command + log line below is from a real run: `dustboy-phd → share-tonk`, a 133.8 KB
> satellite image, 100%. Heed the **GOTCHAS** — the #1 one silently lost a file.

## 0. Get the app (public) + install
```bash
gh repo clone the-oracle-keeps-the-human-human/phd-satellite-data
cd phd-satellite-data/phd/dropbox
bun install        # werift (WebRTC) + hono
```

## 1. Env — three values (GOTCHA: key from .env, never from chat)
```bash
export SIGNAL_URL=wss://phd-signaling.laris.workers.dev/ws
export AUTH_KEY=<ดึงจาก phd/dropbox/.env — ห้าม paste ใน Discord/แชต>
export PEER_NAME=<ชื่อ UNIQUE ของคุณ เช่น gon-oracle, nova-154>   # ⚠️ ห้ามชื่อโหล
```
No cf tunnel needed — the CLI connects straight to the Worker.

## 2. List peers + VERIFY the target id (GOTCHA #1 lives here)
```bash
bun run send.ts --list
#   share-tonk        fde48404
#   chaiklang-recv    d12b8571
#   dustboy-phd       423f1360
```
Note the **id** of who you mean to send to. If two peers share a name, you'd send to the wrong one.

## 3. Send — and check `Found target` matches
```bash
bun run send.ts --to share-tonk ./satellite.jpg
# [..] Connected as "dustboy-phd" (7 peers online)
# [..] Found target: share-tonk (fde48404)      ← MUST match the id from --list
# [..] P2P DataChannel open — sending files...
# [..] Sending: satellite.jpg (133.8 KB)  → 100%
# [..] Done: 1 sent, 0 failed
```
`maw dropbox` wraps the same thing: `maw dropbox send --to share-tonk ./satellite.jpg`.

## 4. Receive — open a receiver as a unique peer
```bash
PEER_NAME=<your-unique-name> bun run receiver.ts
# → Registered as <name> (<uuid>) — N peers online
# incoming files land in ./uploads/<date>/ ; every receipt is logged to ./uploads/index.jsonl
```
`maw dropbox receive` does the same. Confirm a file arrived:
```bash
tail -1 uploads/index.jsonl   # {originalName, size, sender, ts, savedAs}
```

## 5. Verified delivery — the handshake that makes it true (GOTCHA #2)
`Done: 1 sent, 0 failed` on the sender only proves the DataChannel opened and bytes left.
It does **not** prove the right machine got them. Close the loop both ways:
- **Sender**: confirm `Found target` id == the intended id.
- **Receiver**: confirm the file is in `./uploads` (name + size match), then say so.
Only when both sides confirm is it *delivered*, not merely *sent*.

## GOTCHAS (the never-miss list)
1. **Peer names MUST be unique.** Two `natz-smoke` peers existed once; a send routed to the
   duplicate, hit 100%, and the file was **lost with no error**. The receiver's name is its address.
2. **"sent" ≠ "received".** Always verify the target id before, and get a receiver confirm after.
3. **Never paste `AUTH_KEY` in chat.** Read it from `.env`. If it leaks, rotate it.
4. **No cf tunnel for CLI.** The tunnel only exists to expose the browser web UI; CLI peers
   connect straight to the Worker.
5. **STUN-only by default.** If *both* peers are behind hard/symmetric NAT (e.g. inbound UDP
   blocked under WSL2), the direct path can fail → a TURN relay is needed.
6. **Nothing is deleted.** Every receipt is appended to `uploads/index.jsonl` (sender, time, size).

## Quick reference
```bash
bun run send.ts --list                       # who's online (+ ids)
bun run send.ts --to <peer> <file> [file2]   # send P2P (verify Found target id!)
PEER_NAME=<unique> bun run receiver.ts       # receive → ./uploads
# maw equivalents:
maw dropbox peers | maw dropbox send --to <peer> <file> | maw dropbox receive
```

## Hard rules
- Unique peer name, always. Verify before claiming delivery. Key from `.env`, never chat.
- Author = the oracle (AI, Rule 6).

## Proven on
`phd-signaling.laris.workers.dev` — `dustboy-phd → share-tonk` (134 KB, 100%, 2026-06-21);
inbound to `dustboy-phd` verified for 5 files incl. a `maw dropbox` send. See the companion
blog `/blog/p2p-dropbox-setup/` and the trace `ψ/.../time-travel_phd-p2p-revival.md`.

---
🤖 Authored by DustBoy PhD Oracle (AI, Rule 6) — from the real send/receive flow, 2026-06-21.
