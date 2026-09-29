import { Sheet } from "@liquikit/react";
import { Link, useLocation } from "@tanstack/react-router";
import {
	ArrowLeft,
	ArrowRight,
	ArrowUpRight,
	Menu as MenuIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site";
import { components, guides, type Page, sequence } from "./content";
import { mdxComponents } from "./mdx";

const SECTIONS = [
	{ title: "Getting started", pages: guides },
	{ title: "Components", pages: components },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
	const { pathname } = useLocation();
	return (
		<nav aria-label="Documentation" className="flex flex-col gap-8">
			{SECTIONS.map((section) => (
				<div key={section.title}>
					<p className="mb-2 px-3 text-[12.5px] font-medium text-white/50">
						{section.title}
					</p>
					<ul className="flex flex-col gap-px">
						{section.pages.map((entry) => {
							const active = pathname.replace(/\/$/, "") === entry.href;
							return (
								<li key={entry.href}>
									<Link
										to={entry.href}
										onClick={onNavigate}
										aria-current={active ? "page" : undefined}
										className={`block rounded-[9px] px-3 py-[7px] text-[14px] transition-colors ${
											active
												? "bg-white/[0.08] font-medium text-white"
												: "text-white/60 hover:bg-white/[0.04] hover:text-white"
										}`}
									>
										{entry.title}
									</Link>
								</li>
							);
						})}
					</ul>
				</div>
			))}
		</nav>
	);
}

function MobileNav() {
	const [open, setOpen] = useState(false);
	return (
		<div className="lg:hidden">
			<Sheet.Root open={open} onOpenChange={setOpen}>
				<Sheet.Trigger icon size="small" aria-label="Open navigation">
					<MenuIcon className="size-4" />
				</Sheet.Trigger>
				<Sheet.Popup>
					<Sheet.Title>Documentation</Sheet.Title>
					<div className="-mx-3 max-h-[62svh] overflow-y-auto pb-2">
						<NavList onNavigate={() => setOpen(false)} />
					</div>
				</Sheet.Popup>
			</Sheet.Root>
		</div>
	);
}

type Heading = { id: string; text: string; depth: number };

function Outline({ path }: { path: string }) {
	const [headings, setHeadings] = useState<Heading[]>([]);
	const [active, setActive] = useState<string>();

	// biome-ignore lint/correctness/useExhaustiveDependencies: the headings change with the page
	useEffect(() => {
		const article = document.querySelector("article[data-doc]");
		if (!article) return;
		const found = [
			...article.querySelectorAll<HTMLElement>("h2[id], h3[id]"),
		].map((element) => ({
			id: element.id,
			text: element.textContent?.replace(/#$/, "").trim() ?? "",
			depth: element.tagName === "H2" ? 2 : 3,
		}));
		setHeadings(found);
		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries.find((entry) => entry.isIntersecting);
				if (visible) setActive(visible.target.id);
			},
			{ rootMargin: "-80px 0px -70% 0px" },
		);
		for (const heading of found) {
			const element = document.getElementById(heading.id);
			if (element) observer.observe(element);
		}
		return () => observer.disconnect();
	}, [path]);

	if (headings.length === 0) return null;
	return (
		<nav aria-label="On this page" className="text-[13px]">
			<p className="mb-3 font-medium text-white/80">On this page</p>
			<ul className="flex flex-col gap-2">
				{headings.map((heading) => (
					<li key={heading.id} className={heading.depth === 3 ? "pl-3" : ""}>
						<a
							href={`#${heading.id}`}
							className={`transition-colors ${active === heading.id ? "text-white" : "text-white/50 hover:text-white/80"}`}
						>
							{heading.text}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}

function Pager({ current }: { current: Page }) {
	const index = sequence.findIndex((entry) => entry.href === current.href);
	const previous = sequence[index - 1];
	const next = sequence[index + 1];
	return (
		<div className="mt-20 flex items-center justify-between gap-4 border-t border-white/[0.08] pt-8">
			{previous ? (
				<Link
					to={previous.href}
					className="group flex items-center gap-2 text-[14px] text-white/60 hover:text-white"
				>
					<ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
					{previous.title}
				</Link>
			) : (
				<span />
			)}
			{next ? (
				<Link
					to={next.href}
					className="group flex items-center gap-2 text-[14px] text-white/60 hover:text-white"
				>
					{next.title}
					<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
				</Link>
			) : null}
		</div>
	);
}

export function DocsShell({ children }: { children: ReactNode }) {
	return (
		<>
			<SiteHeader docs menu={<MobileNav />} />
			<div className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]">
				<aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] overflow-y-auto border-r border-white/[0.08] px-4 py-8 lg:block">
					<NavList />
				</aside>
				<div className="min-w-0">{children}</div>
			</div>
		</>
	);
}

export function DocPage({ page }: { page: Page }) {
	const { Content } = page;
	return (
		<div className="grid grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_220px]">
			<article
				data-doc=""
				className="mx-auto w-full max-w-[800px] px-5 pt-10 pb-24 sm:px-8 lg:px-12"
			>
				<h1 className="text-[34px] leading-[1.1] font-semibold tracking-[-0.03em] text-white sm:text-[40px]">
					{page.title}
				</h1>
				<p className="mt-3 text-[17px] leading-[1.6] text-white/60">
					{page.description}
				</p>
				{page.base || page.source ? (
					<div className="mt-5 flex flex-wrap gap-2">
						{page.base ? (
							<a
								href={`https://base-ui.com/react/components/${page.base}`}
								className="inline-flex items-center gap-1 rounded-full bg-white/[0.07] px-3 py-1 text-[12.5px] text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white"
							>
								Base UI
								<ArrowUpRight className="size-3.5" />
							</a>
						) : null}
						{page.source ? (
							<a
								href={`${site.github}/blob/main/packages/liquikit/src/${page.source}`}
								className="inline-flex items-center gap-1 rounded-full bg-white/[0.07] px-3 py-1 text-[12.5px] text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white"
							>
								Source
								<ArrowUpRight className="size-3.5" />
							</a>
						) : null}
					</div>
				) : null}
				<div className="mt-10">
					<Content components={mdxComponents} />
				</div>
				<Pager current={page} />
			</article>
			<aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] overflow-y-auto py-10 pr-6 xl:block">
				<Outline path={page.href} />
			</aside>
		</div>
	);
}

export function MissingPage() {
	return (
		<div className="px-8 py-24 text-center">
			<h1 className="text-[28px] font-semibold text-white">Page not found</h1>
			<p className="mt-3 text-white/60">That page is not in the docs.</p>
			<Link
				to="/docs"
				className="mt-6 inline-block text-white underline decoration-white/30 underline-offset-[3px] hover:decoration-white"
			>
				Back to the docs
			</Link>
		</div>
	);
}
