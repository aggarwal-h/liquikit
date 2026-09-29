import { registry } from "virtual:liquikit-docs";
import { Tabs } from "@liquikit/react";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { site } from "@/lib/site";
import { Command } from "./command";
import { InlineCode } from "./inline";
import {
	install,
	ManagerPicker,
	run,
	usePackageManager,
} from "./package-manager";

function closure(name: string) {
	const seen = new Set<string>();
	const visit = (item: string) => {
		if (seen.has(item) || !registry[item]) return;
		seen.add(item);
		for (const dependency of registry[item].registryDependencies)
			visit(dependency);
	};
	visit(name);
	return [...seen];
}

export function Install({ name }: { name: string }) {
	const { manager } = usePackageManager();
	const [view, setView] = useState("cli");
	const items = closure(name);
	const packages = [
		...new Set(
			items.flatMap((item) =>
				registry[item].dependencies.map((dependency) =>
					dependency.replace(/@\^?[\d.]+$/, ""),
				),
			),
		),
	].sort();
	const files = items
		.flatMap((item) => registry[item].files)
		.sort((a, b) => {
			const depth = a.split("/").length - b.split("/").length;
			return depth || a.localeCompare(b);
		});

	return (
		<div className="not-prose my-6">
			<Tabs.Root value={view} onValueChange={setView}>
				<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
					<Tabs.List
						tabs={[
							{ value: "cli", label: "CLI" },
							{ value: "manual", label: "Manual" },
						]}
						height={36}
						aria-label="Installation"
					/>
					<ManagerPicker />
				</div>
			</Tabs.Root>
			{view === "cli" ? (
				<div className="flex flex-col gap-3">
					<Command
						command={run(
							manager,
							`shadcn@latest add ${site.namespace}/${name}`,
						)}
					/>
					<p className="text-[14px] leading-[1.6] text-white/55">
						Needs the {site.namespace} registry in your{" "}
						<InlineCode>components.json</InlineCode>.{" "}
						<a
							href="/docs/installation"
							className="text-white/85 underline decoration-white/25 underline-offset-2 hover:decoration-white/70"
						>
							Set it up once
						</a>
						.
					</p>
				</div>
			) : (
				<ol className="flex flex-col gap-6 border-l border-white/10 pl-6 [counter-reset:step]">
					<li className="relative [counter-increment:step] before:absolute before:-left-[35px] before:grid before:size-[22px] before:place-items-center before:rounded-full before:bg-white/10 before:font-mono before:text-[12px] before:text-white/70 before:content-[counter(step)]">
						<p className="mb-3 text-[15px] text-white/85">
							Install the dependencies.
						</p>
						<Command command={install(manager, packages)} />
					</li>
					<li className="relative [counter-increment:step] before:absolute before:-left-[35px] before:grid before:size-[22px] before:place-items-center before:rounded-full before:bg-white/10 before:font-mono before:text-[12px] before:text-white/70 before:content-[counter(step)]">
						<p className="mb-3 text-[15px] text-white/85">
							Copy these files into <InlineCode>components/liquikit</InlineCode>
							.
						</p>
						<ul className="grid gap-x-6 gap-y-1.5 rounded-[14px] bg-white/[0.03] p-4 font-mono text-[12.5px] ring-1 ring-white/10 sm:grid-cols-2">
							{files.map((file) => (
								<li key={file}>
									<a
										href={`${site.github}/blob/main/packages/liquikit/src/${file}`}
										className="inline-flex items-center gap-1 text-white/70 hover:text-white"
									>
										{file}
										<ArrowUpRight className="size-3 opacity-50" />
									</a>
								</li>
							))}
						</ul>
					</li>
					<li className="relative [counter-increment:step] before:absolute before:-left-[35px] before:grid before:size-[22px] before:place-items-center before:rounded-full before:bg-white/10 before:font-mono before:text-[12px] before:text-white/70 before:content-[counter(step)]">
						<p className="text-[15px] text-white/85">
							Import from <InlineCode>@/components/liquikit/{name}</InlineCode>.
							Keep the folder structure as it is; the files import each other
							relatively.
						</p>
					</li>
				</ol>
			)}
		</div>
	);
}
