import mdx from "@mdx-js/rollup";
import rehypeShiki from "@shikijs/rehype";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import rehypeSlug from "rehype-slug";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";
import { CODE_THEME, docs } from "./plugins/docs.ts";

export default defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		docs(),
		{
			enforce: "pre",
			...mdx({
				remarkPlugins: [
					remarkGfm,
					remarkFrontmatter,
					[remarkMdxFrontmatter, { name: "frontmatter" }],
				],
				rehypePlugins: [rehypeSlug, [rehypeShiki, { theme: CODE_THEME }]],
			}),
		},
		tailwindcss(),
		tanstackStart({ prerender: { enabled: true, crawlLinks: true } }),
		viteReact({ include: /\.(mdx|[jt]sx?)$/ }),
	],
});
