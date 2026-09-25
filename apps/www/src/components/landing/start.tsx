import { Link } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { site } from "@/lib/site";

const COMMAND = "npx shadcn@latest add @liquikit/all";

export function Start() {
	const [copied, setCopied] = useState(false);
	return (
		<section className="relative bg-black px-6 pt-10 pb-36 text-center text-white">
			<h2 className="text-[clamp(30px,4.6vw,52px)] leading-[1.08] font-semibold tracking-[-0.035em]">
				Install in one command
			</h2>
			<p className="mx-auto mt-5 max-w-[540px] text-[17px] leading-[1.55] text-white/60">
				Add the {site.namespace} registry to your components.json, then install
				any component with the shadcn CLI. The code lands in your project, yours
				to change.
			</p>
			<div className="mt-9 flex flex-wrap items-center justify-center gap-3">
				<button
					type="button"
					onClick={() => {
						navigator.clipboard.writeText(COMMAND);
						setCopied(true);
						setTimeout(() => setCopied(false), 1600);
					}}
					className="flex max-w-full items-center gap-3 rounded-full border border-white/12 bg-white/[0.06] py-3 pr-4 pl-5 font-mono text-[14px] text-white/90 transition-colors hover:bg-white/[0.1]"
				>
					<span className="text-white/40">$</span>
					<span className="truncate">{COMMAND}</span>
					{copied ? (
						<Check className="size-4 shrink-0 text-[var(--neon-hot)]" />
					) : (
						<Copy className="size-4 shrink-0 text-white/50" />
					)}
					<span className="sr-only">{copied ? "Copied" : "Copy command"}</span>
				</button>
				<Link
					to="/docs"
					className="rounded-full bg-white px-5 py-3 text-[14px] font-medium text-black transition-colors hover:bg-white/85"
				>
					Read the docs
				</Link>
			</div>
		</section>
	);
}
