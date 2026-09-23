import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const src = join(root, "src");
const registryUrl = (
	process.env.REGISTRY_URL ?? "https://liquikit.dev/r"
).replace(/\/$/, "");

const components: Record<string, [title: string, description: string]> = {
	accordion: [
		"Accordion",
		"Sections that open on a spring inside one slab of glass, and a collapsible.",
	],
	alert: [
		"Alert",
		"An alert dialog that grows out of a droplet in its own middle.",
	],
	autocomplete: ["Autocomplete", "A glass field that suggests as you type."],
	avatar: ["Avatar", "A picture or initials in a disc of glass."],
	button: ["Button", "A glass button that swells and lights up under a press."],
	checkbox: [
		"Checkbox",
		"A small drop of glass that fills with the accent, and a checkbox group.",
	],
	combobox: [
		"Combobox",
		"A glass field with a list that buds off it and reshapes as you type.",
	],
	"context-menu": [
		"Context Menu",
		"A menu that grows from where the pointer was.",
	],
	dialog: [
		"Dialog",
		"A panel that grows out of its button and flies home into it.",
	],
	field: ["Field", "Glass text inputs, fields, fieldsets and forms."],
	menu: ["Menu", "A menu that pours out of its button like liquid."],
	menubar: [
		"Menubar",
		"A capsule of menu titles whose menus share one panel of glass.",
	],
	meter: ["Meter", "Frosted meter and progress bars."],
	"navigation-menu": [
		"Navigation Menu",
		"A navigation bar whose one panel reshapes between titles.",
	],
	"number-field": ["Number Field", "A glass stepper with a scrub area."],
	"otp-field": ["OTP Field", "A one-time code input in slots of glass."],
	popover: ["Popover", "A glass popover that grows out of its trigger."],
	"preview-card": ["Preview Card", "A preview that buds off a link."],
	radio: ["Radio", "Glass radio buttons in a radio group."],
	"scroll-area": [
		"Scroll Area",
		"A scrolling area with an overlay scrollbar, and a separator.",
	],
	"search-field": [
		"Search Field",
		"A capsule of glass with a magnifying glass and a clear button.",
	],
	"segmented-control": [
		"Segmented Control",
		"A pill of liquid glass you can drag between options.",
	],
	select: ["Select", "A select whose list grows out of its button."],
	sheet: [
		"Sheet",
		"A sheet of glass that floats up and can be pulled back down.",
	],
	slider: ["Slider", "A glass knob that turns to liquid as you drag it."],
	switch: ["Switch", "A switch whose knob lifts into a lens as it slides."],
	tabs: ["Tabs", "Tabs and a floating tab bar with a lens you can drag."],
	toast: [
		"Toast",
		"Notifications that unfold out of a capsule at the top edge.",
	],
	toggle: ["Toggle", "A glass toggle button."],
	"toggle-group": [
		"Toggle Group",
		"Toggles that merge into one capsule of glass.",
	],
	toolbar: ["Toolbar", "A capsule of glass holding buttons and separators."],
	tooltip: ["Tooltip", "A tooltip that swells out of nothing."],
};

const libs: Record<
	string,
	{ title: string; description: string; files: string[] }
> = {
	glass: {
		title: "Glass",
		description:
			"The refraction engine: lens maps, the SVG filter and the glass surfaces.",
		files: readdirSync(join(src, "glass")).map((file) => `glass/${file}`),
	},
	core: {
		title: "Core",
		description: "Shared types and the component styles.",
		files: ["types.ts", "liquikit.css"],
	},
	press: {
		title: "Press",
		description: "Press feedback shared by the controls.",
		files: ["press.ts"],
	},
	popup: {
		title: "Popup",
		description: "The morphing glass panel behind every popup.",
		files: ["popup.tsx"],
	},
	segments: {
		title: "Segments",
		description: "Helpers shared by the segmented controls.",
		files: ["segments.tsx"],
	},
};

const owner = new Map<string, string>();
for (const [name, lib] of Object.entries(libs))
	for (const file of lib.files) owner.set(file, name);
for (const name of Object.keys(components)) owner.set(`${name}.tsx`, name);

const packages: Record<string, string> = {
	"@base-ui/react": "@base-ui/react@^1.8.0",
	motion: "motion@^13.4.4",
};

function imports(file: string) {
	const text = readFileSync(join(src, file), "utf8");
	return [...text.matchAll(/(?:from|import)\s+"([^"]+)"/g)].map(
		(match) => match[1],
	);
}

function resolveLocal(from: string, specifier: string) {
	const dir = from.includes("/")
		? from.slice(0, from.lastIndexOf("/") + 1)
		: "";
	const path = join(dir, specifier).replace(/\\/g, "/");
	if (path === "glass" || path.startsWith("glass/")) return "glass/index.ts";
	for (const candidate of [path, `${path}.ts`, `${path}.tsx`])
		if (owner.has(candidate)) return candidate;
	throw new Error(`${from} imports ${specifier}, which no registry item owns`);
}

function item(
	name: string,
	type: string,
	title: string,
	description: string,
	files: string[],
) {
	const dependencies = new Set<string>();
	const registryDependencies = new Set<string>();
	for (const file of files) {
		for (const specifier of imports(file)) {
			if (specifier.startsWith(".")) {
				const other = owner.get(resolveLocal(file, specifier));
				if (other && other !== name)
					registryDependencies.add(`${registryUrl}/${other}.json`);
				continue;
			}
			const pkg = specifier.startsWith("@")
				? specifier.split("/").slice(0, 2).join("/")
				: specifier.split("/")[0];
			if (packages[pkg]) dependencies.add(packages[pkg]);
			else if (pkg !== "react" && pkg !== "react-dom")
				throw new Error(`${file} imports ${pkg}, which has no pinned version`);
		}
	}
	return {
		name,
		type,
		title,
		description,
		dependencies: [...dependencies].sort(),
		registryDependencies: [...registryDependencies].sort(),
		files: files.map((file) => ({
			path: `src/${file}`,
			type: file.endsWith(".css") ? "registry:file" : type,
			target: `@components/liquikit/${file}`,
		})),
	};
}

const items = [
	...Object.entries(libs).map(([name, lib]) =>
		item(name, "registry:lib", lib.title, lib.description, lib.files),
	),
	...Object.entries(components).map(([name, [title, description]]) =>
		item(name, "registry:ui", title, description, [`${name}.tsx`]),
	),
];

const unowned = readdirSync(src).filter(
	(file) => file.includes(".") && file !== "index.ts" && !owner.has(file),
);
if (unowned.length)
	throw new Error(`Not in the registry: ${unowned.join(", ")}`);

items.push({
	name: "all",
	type: "registry:item",
	title: "All components",
	description: "Every LiquiKit component.",
	dependencies: [],
	registryDependencies: Object.keys(components).map(
		(name) => `${registryUrl}/${name}.json`,
	),
	files: [],
});

writeFileSync(
	join(root, "registry.json"),
	`${JSON.stringify(
		{
			$schema: "https://ui.shadcn.com/schema/registry.json",
			name: "liquikit",
			homepage: registryUrl.replace(/\/r$/, ""),
			items,
		},
		null,
		2,
	)}\n`,
);
console.log(`registry.json: ${items.length} items → ${registryUrl}`);
