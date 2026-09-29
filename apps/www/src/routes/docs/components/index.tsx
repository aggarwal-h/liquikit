import { createFileRoute, Link } from "@tanstack/react-router";
import { components } from "@/components/docs/content";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/docs/components/")({
	head: () =>
		pageHead({
			title: "Components",
			description:
				"Every LiquiKit component, built on Base UI and installed with the shadcn CLI.",
			href: "/docs/components",
		}),
	component: ComponentIndex,
});

function ComponentIndex() {
	return (
		<div className="mx-auto w-full max-w-[1040px] px-5 pt-10 pb-24 sm:px-8 lg:px-12">
			<h1 className="text-[34px] leading-[1.1] font-semibold tracking-[-0.03em] text-white sm:text-[40px]">
				Components
			</h1>
			<p className="mt-3 max-w-[620px] text-[17px] leading-[1.6] text-white/60">
				{components.length} components, each built on a Base UI primitive and
				installed into your project with the shadcn CLI.
			</p>
			<ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{components.map((entry) => (
					<li key={entry.slug}>
						<Link
							to={entry.href}
							className="block h-full rounded-[16px] bg-white/[0.03] p-5 ring-1 ring-white/[0.08] transition-colors hover:bg-white/[0.06] hover:ring-white/20"
						>
							<p className="text-[15px] font-medium text-white">
								{entry.title}
							</p>
							<p className="mt-1.5 text-[13.5px] leading-[1.55] text-white/50">
								{entry.description}
							</p>
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
