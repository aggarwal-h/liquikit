import { createFileRoute, notFound } from "@tanstack/react-router";
import { findGuide } from "@/components/docs/content";
import { DocPage, MissingPage } from "@/components/docs/layout";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/docs/$slug")({
	loader: ({ params }) => {
		if (!findGuide(params.slug) || params.slug === "index") throw notFound();
	},
	head: ({ params }) => pageHead(findGuide(params.slug)),
	component: Guide,
	notFoundComponent: MissingPage,
});

function Guide() {
	const { slug } = Route.useParams();
	const page = findGuide(slug);
	return page ? <DocPage page={page} /> : <MissingPage />;
}
