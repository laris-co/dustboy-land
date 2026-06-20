import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// DustBoy PhD Oracle — static gallery-native landing + blog, deployed on Cloudflare.
export default defineConfig({
  site: "https://dustboy.buildwithoracle.com",
  output: "static",
  adapter: cloudflare(),
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    server: { watch: { ignored: ["**/ψ/**"] } },
  },
});
