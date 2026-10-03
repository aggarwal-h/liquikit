import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/landing/hero";
import { NeonProvider } from "@/components/landing/neon";
import { Showcase } from "@/components/landing/showcase/showcase";
import { Start } from "@/components/landing/start";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ property: "og:url", content: `${site.url}/` },
			{
				"script:ld+json": {
					"@context": "https://schema.org",
					"@type": "WebSite",
					name: site.name,
					url: `${site.url}/`,
					description: site.description,
				},
			},
		],
		links: [{ rel: "canonical", href: `${site.url}/` }],
	}),
	component: Home,
});

function Home() {
	return (
		<NeonProvider>
			<SiteHeader />
			<main>
				<Hero />
				<Showcase />
				<Start />
			</main>
		</NeonProvider>
	);
}
