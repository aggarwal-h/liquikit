import { Tabs } from "@liquikit/react";
import { type ComponentType, useEffect, useState } from "react";
import { Highlighted } from "./code-block";
import { Stage } from "./stage";

type Source = { code: string; html: string };

const examples = import.meta.glob<ComponentType>("../../examples/*.tsx", {
	eager: true,
	import: "default",
});

const sources = import.meta.glob<Source>("../../examples/*.tsx", {
	query: "?highlight",
	import: "default",
});

export function ComponentPreview({
	name,
	align = "center",
}: {
	name: string;
	align?: "center" | "start";
}) {
	const path = `../../examples/${name}.tsx`;
	const Example = examples[path];
	const [view, setView] = useState("preview");
	const [source, setSource] = useState<Source | null>(null);

	useEffect(() => {
		let live = true;
		sources[path]?.().then((loaded) => {
			if (live) setSource(loaded);
		});
		return () => {
			live = false;
		};
	}, [path]);

	if (!Example) {
		return (
			<p className="my-6 rounded-[14px] bg-red-500/10 p-4 text-[14px] text-red-300">
				Missing example: {name}
			</p>
		);
	}

	return (
		<div className="not-prose my-6">
			<Tabs.Root value={view} onValueChange={setView}>
				<div className="mb-3 flex items-center">
					<Tabs.List
						tabs={[
							{ value: "preview", label: "Preview" },
							{ value: "code", label: "Code" },
						]}
						height={36}
						aria-label="View"
					/>
				</div>
				<div className="overflow-hidden rounded-[18px] ring-1 ring-white/10">
					{view === "preview" ? (
						<Stage align={align}>
							<Example />
						</Stage>
					) : source ? (
						<Highlighted html={source.html} code={source.code} />
					) : (
						<div className="h-[340px] bg-[#0d1117]" />
					)}
				</div>
			</Tabs.Root>
		</div>
	);
}
