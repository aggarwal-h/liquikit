import { createFileRoute, notFound } from "@tanstack/react-router";
import { findComponent } from "@/components/docs/content";
import { DocPage, MissingPage } from "@/components/docs/layout";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/docs/components/$slug")({
	loader: ({ params }) => {
		if (!findComponent(params.slug)) throw notFound();
	},
	head: ({ params }) => pageHead(findComponent(params.slug)),
	component: ComponentDoc,
	notFoundComponent: MissingPage,
});

function ComponentDoc() {
	const { slug } = Route.useParams();
	const page = findComponent(slug);
	return page ? <DocPage page={page} /> : <MissingPage />;
}
