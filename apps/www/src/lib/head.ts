import { site } from "./site";

export function pageHead(page?: {
	title: string;
	description: string;
	href: string;
}) {
	if (!page) return {};
	const title = `${page.title} · ${site.name}`;
	const url = `${site.url}${page.href}`;
	return {
		meta: [
			{ title },
			{ name: "description", content: page.description },
			{ property: "og:title", content: title },
			{ property: "og:description", content: page.description },
			{ property: "og:url", content: url },
		],
		links: [{ rel: "canonical", href: url }],
	};
}
