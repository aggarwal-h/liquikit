import { GlassPane } from "@/components/liquikit/glass";
import { BuyButton } from "./buy";

const LINKS = [
	{ href: "#light", label: "Light" },
	{ href: "#control", label: "Control" },
	{ href: "#design", label: "Design" },
	{ href: "#specs", label: "Specs" },
];

export function Subnav() {
	return (
		<header className="sticky top-3 z-50 mx-auto w-[min(980px,calc(100%-24px))]">
			<GlassPane radius="capsule" className="w-full">
				<nav
					aria-label="Lumen"
					className="flex h-12 items-center gap-6 pr-1.5 pl-5"
				>
					<a
						href="#top"
						className="text-[19px] font-semibold tracking-[-0.03em]"
					>
						Lumen
					</a>
					<div className="ml-auto flex items-center gap-5 text-[13px] text-(--ink)/80 max-sm:hidden">
						{LINKS.map((link) => (
							<a
								key={link.href}
								href={link.href}
								className="transition-opacity hover:opacity-60"
							>
								{link.label}
							</a>
						))}
					</div>
					<BuyButton className="max-sm:ml-auto" />
				</nav>
			</GlassPane>
		</header>
	);
}

const SPECS = [
	{
		figure: "2700–6500",
		unit: "K",
		text: "Every white, from candlelight to midday sky.",
	},
	{
		figure: "1600",
		unit: "lm",
		text: "Bright enough to light a whole room on its own.",
	},
	{
		figure: "30",
		unit: "min",
		text: "A slow sunrise that wakes you before the alarm.",
	},
];

export function Specs() {
	return (
		<section
			id="specs"
			className="mx-auto max-w-[980px] scroll-mt-20 px-6 pt-32 pb-24"
		>
			<dl className="grid gap-12 text-center sm:grid-cols-3 sm:gap-8">
				{SPECS.map((spec) => (
					<div key={spec.unit} className="flex flex-col items-center gap-3">
						<dt className="text-[clamp(38px,4.2vw,52px)] leading-none font-semibold tracking-[-0.04em] whitespace-nowrap tabular-nums">
							{spec.figure}
							<span className="ml-1 text-[0.45em] font-medium tracking-normal text-(--muted)">
								{spec.unit}
							</span>
						</dt>
						<dd className="max-w-[24ch] text-[17px] text-(--muted)">
							{spec.text}
						</dd>
					</div>
				))}
			</dl>
		</section>
	);
}

export function Footer() {
	return (
		<footer className="mx-auto max-w-[980px] border-t border-(--hair) px-6 py-8 text-[12px] leading-relaxed text-(--muted)">
			<p>
				Lumen is a made-up product, designed to show what can be built with{" "}
				<a
					href="https://liquikit.dev"
					className="text-(--link) hover:underline"
				>
					LiquiKit
				</a>
				. Its price, features and delivery times are examples.
			</p>
		</footer>
	);
}
