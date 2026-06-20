import { glob } from "astro/loaders";
import { z, defineCollection } from "astro:content";

// The "markdown database": blog posts (MDX) + projects (MD), Zod-validated at build.
const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/data/blog" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    lang: z.enum(["th", "en"]).default("th"),
    draft: z.boolean().default(false),
    reading: z.string().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/data/projects" }),
  schema: z.object({
    name: z.string(),
    blurb: z.string(),
    url: z.string().optional(),
    stack: z.array(z.string()).default([]),
    order: z.number().default(0),
  }),
});

export const collections = { blog, projects };
