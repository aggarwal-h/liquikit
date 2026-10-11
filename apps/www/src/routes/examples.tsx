import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { NeonProvider } from "@/components/landing/neon";
import { SiteHeader } from "@/components/site-header";
import { examples } from "@/lib/examples";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/examples")({
	head: () =>
		pageHead({
			title: "Examples",
			description:
				"Finished pages built with LiquiKit, each a real app in the repository.",
			href: "/examples",
		}),
	component: Examples,
});

function Examples() {
	return (
		<NeonProvider>
			<SiteHeader docs />
			<main className="mx-auto w-full max-w-[1040px] px-5 pt-12 pb-32 sm:px-8">
				<h1 className="text-[34px] leading-[1.1] font-semibold tracking-[-0.03em] text-white sm:text-[40px]">
					Examples
				</h1>
				<p className="mt-3 max-w-[620px] text-[17px] leading-[1.6] text-white/60">
					Finished pages built with the registry, the way you would build yours.
					Each one is a real app in the repository, with notes on where the
					glass bends and why.
				</p>
				<ul className="mt-12 flex flex-col gap-10">
					{examples.map((example) => (
						<li
							key={example.slug}
							className="overflow-hidden rounded-[24px] bg-white/[0.03] ring-1 ring-white/[0.08]"
						>
							<a
								href={example.url}
								target="_blank"
								rel="noopener"
								aria-label={`Open ${example.title} in a new tab`}
								className="group block bg-black"
							>
								<img
									src={example.image}
									alt={example.alt}
									width={1200}
									height={784}
									className="w-full transition-transform duration-700 ease-out group-hover:scale-[1.015]"
								/>
							</a>
							<div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between">
								<div className="max-w-[600px]">
									<p className="text-[13px] font-medium text-white/45">
										{example.stack}
									</p>
									<h2 className="mt-1 text-[24px] leading-tight font-semibold tracking-[-0.02em] text-white">
										{example.title}
									</h2>
									<p className="mt-1 text-[17px] text-white/75">
										{example.tagline}
									</p>
									<p className="mt-3 text-[15px] leading-[1.6] text-white/55">
										{example.description}
									</p>
									<ul className="mt-5 flex flex-wrap gap-1.5">
										{example.parts.map((part) => (
											<li
												key={part}
												className="rounded-full bg-white/[0.06] px-2.5 py-1 font-mono text-[11.5px] text-white/60"
											>
												@liquikit/{part}
											</li>
										))}
									</ul>
								</div>
								<div className="flex shrink-0 flex-wrap gap-3">
									<a
										href={example.url}
										target="_blank"
										rel="noopener"
										className="inline-flex items-center gap-1 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition-colors hover:bg-white/85"
									>
										Open {example.title}
										<ArrowUpRight className="size-3.5" />
									</a>
									<a
										href={example.source}
										className="inline-flex items-center gap-1 rounded-full border border-white/12 px-5 py-2.5 text-[14px] text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
									>
										Source
										<ArrowUpRight className="size-3.5" />
									</a>
								</div>
							</div>
						</li>
					))}
				</ul>
			</main>
		</NeonProvider>
	);
}
