import { Link } from "@tanstack/react-router";
import { NeonProvider } from "@/components/landing/neon";
import { SiteHeader } from "@/components/site-header";

export function NotFound() {
	return (
		<NeonProvider>
			<meta name="robots" content="noindex" />
			<SiteHeader docs />
			<main className="px-8 py-32 text-center">
				<h1 className="text-[28px] font-semibold text-white">Page not found</h1>
				<p className="mt-3 text-white/60">That page does not exist.</p>
				<div className="mt-6 flex justify-center gap-6">
					<Link
						to="/"
						className="text-white underline decoration-white/30 underline-offset-[3px] hover:decoration-white"
					>
						Home
					</Link>
					<Link
						to="/docs"
						className="text-white underline decoration-white/30 underline-offset-[3px] hover:decoration-white"
					>
						Docs
					</Link>
				</div>
			</main>
		</NeonProvider>
	);
}
