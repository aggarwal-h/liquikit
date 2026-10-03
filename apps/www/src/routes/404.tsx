import { createFileRoute } from "@tanstack/react-router";
import { NotFound } from "@/components/not-found";
import { site } from "@/lib/site";

// Prerendered to 404.html, which static hosts serve for unknown paths.
export const Route = createFileRoute("/404")({
	head: () => ({ meta: [{ title: `Page not found · ${site.name}` }] }),
	component: NotFound,
});
