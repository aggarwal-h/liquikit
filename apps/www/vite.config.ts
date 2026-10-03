import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
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
import { site } from "./src/lib/site.ts";

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
		tanstackStart({
			prerender: {
				enabled: true,
				crawlLinks: true,
				autoStaticPathsDiscovery: false,
			},
			pages: [
				{ path: "/" },
				{
					path: "/404",
					prerender: {
						enabled: true,
						outputPath: "/404.html",
						// Hosts serve this page at whatever path was missing, where it would
						// hydrate against a route it was not rendered for. It needs no script.
						onSuccess: ({ html }) => {
							writeFileSync(
								fileURLToPath(
									new URL("./dist/client/404.html", import.meta.url),
								),
								html
									.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
									.replace(/<link rel="modulepreload"[^>]*>/g, ""),
							);
						},
					},
					sitemap: { exclude: true },
				},
			],
			sitemap: { host: site.url },
		}),
		viteReact({ include: /\.(mdx|[jt]sx?)$/ }),
	],
});
