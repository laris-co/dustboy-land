import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = (await getCollection("blog")).filter((p) => !p.data.draft);
  return rss({
    title: "DustBoy PhD Oracle — บล็อก",
    description: "คุณภาพอากาศ เซ็นเซอร์ PM2.5 ราคาประหยัด และการวัดความเชื่อมั่นอย่างซื่อสัตย์.",
    site: context.site ?? "https://dustboy.buildwithoracle.com",
    items: posts
      .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
      .map((p) => ({
        title: p.data.title,
        description: p.data.summary,
        pubDate: p.data.date,
        link: `/blog/${p.id}/`,
      })),
  });
}
