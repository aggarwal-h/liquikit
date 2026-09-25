import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/landing/hero";
import { NeonProvider } from "@/components/landing/neon";
import { Start } from "@/components/landing/start";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<NeonProvider>
			<SiteHeader />
			<main>
				<Hero />
				<Start />
			</main>
		</NeonProvider>
	);
}
