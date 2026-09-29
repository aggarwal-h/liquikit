import { createFileRoute } from "@tanstack/react-router";
import { findGuide } from "@/components/docs/content";
import { DocPage, MissingPage } from "@/components/docs/layout";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/docs/")({
	head: () => pageHead(findGuide("index")),
	component: () => {
		const page = findGuide("index");
		return page ? <DocPage page={page} /> : <MissingPage />;
	},
});
