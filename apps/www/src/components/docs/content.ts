import type { MDXComponents } from "mdx/types";
import type { ComponentType } from "react";

export type Frontmatter = {
	title: string;
	description: string;
	base?: string;
	source?: string;
};

type Module = {
	default: ComponentType<{ components?: MDXComponents }>;
	frontmatter: Frontmatter;
};

export type Page = Frontmatter & {
	slug: string;
	href: string;
	Content: Module["default"];
};

const GUIDE_ORDER = [
	"index",
	"installation",
	"theming",
	"glass-pane",
	"how-it-works",
	"limitations",
];

const guideModules = import.meta.glob<Module>("/content/docs/*.mdx", {
	eager: true,
});
const componentModules = import.meta.glob<Module>("/content/components/*.mdx", {
	eager: true,
});

function slugOf(path: string) {
	return (
		path
			.split("/")
			.pop()
			?.replace(/\.mdx$/, "") ?? ""
	);
}

function page(path: string, module: Module, href: string): Page {
	return {
		...module.frontmatter,
		slug: slugOf(path),
		href,
		Content: module.default,
	};
}

export const guides: Page[] = Object.entries(guideModules)
	.map(([path, module]) => {
		const slug = slugOf(path);
		return page(path, module, slug === "index" ? "/docs" : `/docs/${slug}`);
	})
	.sort((a, b) => GUIDE_ORDER.indexOf(a.slug) - GUIDE_ORDER.indexOf(b.slug));

export const components: Page[] = Object.entries(componentModules)
	.map(([path, module]) =>
		page(path, module, `/docs/components/${slugOf(path)}`),
	)
	.sort((a, b) => a.title.localeCompare(b.title));

export const sequence = [...guides, ...components];

export function findGuide(slug: string) {
	return guides.find((entry) => entry.slug === slug);
}

export function findComponent(slug: string) {
	return components.find((entry) => entry.slug === slug);
}
