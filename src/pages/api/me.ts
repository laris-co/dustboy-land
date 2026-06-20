import type { APIRoute } from "astro";
import { readSession, getCookie, envOf, SESSION_COOKIE, OWNER } from "../../lib/siwe";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const env = envOf(locals);
  const address = await readSession(getCookie(request, SESSION_COOKIE), env);
  if (!address) {
    return new Response(JSON.stringify({ authed: false }), {
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }

  // per-address content: owner tier vs member tier
  const tier = address.toLowerCase() === OWNER ? "owner" : "member";
  const content =
    tier === "owner"
      ? {
          title: "ยินดีต้อนรับ ผู้ก่อตั้ง 👑",
          body: "address นี้คือเจ้าของภารกิจ — เข้าถึงได้ทุกอย่าง: defense prep, บันทึกวิจัยดิบ, และ roadmap สู่ ดร.",
          links: [
            { label: "Defense Q&A — เตรียมสอบ", href: "/blog/honest-eval-r2-070/" },
            { label: "หลักห้าข้อ (ฉบับเต็ม)", href: "/books/children-of-atlas/" },
          ],
        }
      : {
          title: "ยินดีต้อนรับ สมาชิก ✨",
          body: "sign-in ด้วย wallet สำเร็จ — ปลดล็อกเนื้อหาเฉพาะสมาชิกแล้ว ขอบคุณที่แวะมาทำความรู้จัก DustBoy",
          links: [
            { label: "เบื้องหลังวิทยานิพนธ์ (members)", href: "/blog/confidence-scoring-a-f/" },
            { label: "ห้องสมุดหนังสือ", href: "/books/" },
          ],
        };

  return new Response(JSON.stringify({ authed: true, address, tier, content }), {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
};
