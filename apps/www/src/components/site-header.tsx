import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { site } from "@/lib/site";

export function SiteHeader({
	docs = false,
	menu,
}: {
	docs?: boolean;
	menu?: ReactNode;
}) {
	return (
		<header
			className={
				docs
					? "sticky top-0 z-40 border-b border-white/[0.08] bg-black/80 backdrop-blur-xl"
					: "absolute inset-x-0 top-0 z-40"
			}
		>
			<div className="mx-auto flex h-14 max-w-[1440px] items-center gap-6 px-4 sm:px-6">
				{docs ? (
					<Link
						to="/"
						className="shrink-0 text-[15px] whitespace-nowrap text-white"
						aria-label={`${site.name} home`}
					>
						<Logo mono />
					</Link>
				) : null}
				<nav
					className={`items-center gap-5 text-[14px] text-white/60 ${docs ? "hidden sm:flex" : "flex"}`}
				>
					<Link
						to="/docs"
						activeOptions={{ exact: true }}
						className="transition-colors hover:text-white"
						activeProps={{ className: "text-white" }}
					>
						Docs
					</Link>
					<Link
						to="/docs/components"
						className="transition-colors hover:text-white"
						activeProps={{ className: "text-white" }}
					>
						Components
					</Link>
				</nav>
				<div className="ml-auto flex items-center gap-2">
					<a
						href={site.github}
						className="inline-flex items-center gap-1 px-2 py-1.5 text-[14px] text-white/60 transition-colors hover:text-white"
					>
						GitHub
						<ArrowUpRight className="size-3.5" />
					</a>
					{menu}
				</div>
			</div>
		</header>
	);
}
