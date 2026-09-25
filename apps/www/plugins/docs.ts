import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { createHighlighter, type Highlighter } from "shiki";
import ts from "typescript";
import type { Plugin } from "vite";

export const CODE_THEME = "github-dark-default";

const LIBRARY = join(import.meta.dirname, "../../../packages/liquikit");
const SOURCE = join(LIBRARY, "src");
const INSTALL_ROOT = "@/components/liquikit";

let highlighter: Promise<Highlighter> | undefined;

export function highlight(code: string, lang = "tsx") {
	highlighter ??= createHighlighter({
		themes: [CODE_THEME],
		langs: ["tsx", "ts", "bash", "json", "css"],
	});
	return highlighter.then((shiki) =>
		shiki.codeToHtml(code, { lang, theme: CODE_THEME }),
	);
}

function parse(file: string, text = readFileSync(file, "utf8")) {
	return ts.createSourceFile(
		file,
		text,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TSX,
	);
}

function exportMap() {
	const map = new Map<string, string>();
	const index = parse(join(SOURCE, "index.ts"));
	index.forEachChild((node) => {
		if (!ts.isExportDeclaration(node) || !node.moduleSpecifier) return;
		const from = (node.moduleSpecifier as ts.StringLiteral).text.replace(
			"./",
			"",
		);
		if (node.exportClause && ts.isNamedExports(node.exportClause)) {
			for (const element of node.exportClause.elements) {
				map.set(element.name.text, from);
			}
		}
	});
	return map;
}

export function rewriteImports(code: string) {
	const map = exportMap();
	const file = parse("example.tsx", code);
	const edits: Array<[number, number, string]> = [];
	file.forEachChild((node) => {
		if (!ts.isImportDeclaration(node)) return;
		const from = (node.moduleSpecifier as ts.StringLiteral).text;
		if (from === "@liquikit/react/glass") {
			edits.push([
				node.moduleSpecifier.getStart(file),
				node.moduleSpecifier.getEnd(),
				`"${INSTALL_ROOT}/glass"`,
			]);
			return;
		}
		if (from !== "@liquikit/react") return;
		const bindings = node.importClause?.namedBindings;
		if (!bindings || !ts.isNamedImports(bindings)) return;
		const groups = new Map<string, string[]>();
		for (const element of bindings.elements) {
			const module = map.get(element.name.text) ?? "glass";
			const list = groups.get(module) ?? [];
			list.push(element.getText(file));
			groups.set(module, list);
		}
		const lines = [...groups]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(
				([module, names]) =>
					`import { ${names.join(", ")} } from "${INSTALL_ROOT}/${module}";`,
			);
		edits.push([node.getStart(file), node.getEnd(), lines.join("\n")]);
	});
	let result = code;
	for (const [start, end, text] of edits.sort((a, b) => b[0] - a[0])) {
		result = result.slice(0, start) + text + result.slice(end);
	}
	return result;
}

type Prop = {
	name: string;
	type: string;
	optional: boolean;
	default?: string;
};

type Part = {
	name: string;
	props: Prop[];
	base?: string;
};

const GLASS_OPTIONS: Prop[] = [
	{ name: "theme", type: '"light" | "dark"', optional: true },
	{ name: "lens", type: "Partial<LensProfile>", optional: true },
	{ name: "liquid", type: "number", optional: true },
];

function baseLinks(file: ts.SourceFile) {
	const links = new Map<string, string>();
	file.forEachChild((node) => {
		if (!ts.isImportDeclaration(node)) return;
		const from = (node.moduleSpecifier as ts.StringLiteral).text;
		const match = /^@base-ui\/react\/(.+)$/.exec(from);
		const bindings = node.importClause?.namedBindings;
		if (!match || !bindings || !ts.isNamedImports(bindings)) return;
		for (const element of bindings.elements) {
			links.set(element.name.text, match[1]);
		}
	});
	return links;
}

function defaults(file: ts.SourceFile) {
	const found = new Map<string, Map<string, string>>();
	const visit = (node: ts.Node) => {
		if (
			(ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) &&
			node.parameters.length > 0
		) {
			const [param] = node.parameters;
			if (
				param.type &&
				ts.isTypeReferenceNode(param.type) &&
				ts.isObjectBindingPattern(param.name)
			) {
				const values = new Map<string, string>();
				for (const element of param.name.elements) {
					if (!element.initializer) continue;
					const key = (element.propertyName ?? element.name).getText(file);
					values.set(
						key.replaceAll('"', ""),
						element.initializer.getText(file),
					);
				}
				found.set(param.type.typeName.getText(file), values);
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(file);
	return found;
}

function partName(type: string, values: string[]) {
	const name = type.replace(/Props$/, "");
	const owner = [...values]
		.sort((a, b) => b.length - a.length)
		.find((value) => name.startsWith(value));
	if (!owner || owner === name) return name;
	return `${owner}.${name.slice(owner.length)}`;
}

export function extractProps() {
	const exports = exportMap();
	const modules = new Map<string, string[]>();
	for (const [name, module] of exports) {
		if (/^[A-Z]/.test(name) && !name.endsWith("Props")) {
			modules.set(module, [...(modules.get(module) ?? []), name]);
		}
	}
	const all = new Map<string, Prop[]>();
	const result: Record<string, Part[]> = {};

	const files = [
		...readdirSync(SOURCE).filter((file) => file.endsWith(".tsx")),
		"glass/glass-pane.tsx",
		"glass/scope.tsx",
		"glass/theme.tsx",
	];
	const sources = new Map(
		files.map((file) => [file, parse(join(SOURCE, file))]),
	);
	modules.set("glass-pane", ["GlassPane"]);
	modules.set("scope", ["GlassScope"]);
	modules.set("theme", ["GlassThemeProvider"]);

	const collect = (
		file: ts.SourceFile,
		node: ts.TypeNode,
		locals: Map<string, ts.TypeNode>,
		links: Map<string, string>,
		part: { props: Prop[]; base?: string },
	) => {
		if (ts.isIntersectionTypeNode(node)) {
			for (const type of node.types) collect(file, type, locals, links, part);
			return;
		}
		if (ts.isParenthesizedTypeNode(node)) {
			collect(file, node.type, locals, links, part);
			return;
		}
		if (ts.isTypeLiteralNode(node)) {
			for (const member of node.members) {
				if (!ts.isPropertySignature(member) || !member.name) continue;
				part.props.push({
					name: member.name.getText(file).replaceAll('"', ""),
					type: member.type?.getText(file).replace(/\s+/g, " ") ?? "unknown",
					optional: Boolean(member.questionToken),
				});
			}
			return;
		}
		if (!ts.isTypeReferenceNode(node)) return;
		const name = node.typeName.getText(file);
		if (name === "GlassOptions") {
			part.props.push(...GLASS_OPTIONS);
			return;
		}
		if (locals.has(name)) {
			collect(file, locals.get(name) as ts.TypeNode, locals, links, part);
			return;
		}
		const [first] = node.typeArguments ?? [];
		if ((name === "Omit" || name === "Pick") && first) {
			if (
				ts.isTypeReferenceNode(first) &&
				all.has(first.typeName.getText(file))
			) {
				const keys = new Set(
					(node.typeArguments?.[1]?.getText(file) ?? "")
						.split("|")
						.map((key) => key.trim().replaceAll('"', "")),
				);
				const source = all.get(first.typeName.getText(file)) ?? [];
				part.props.push(
					...source.filter((prop) =>
						name === "Pick" ? keys.has(prop.name) : !keys.has(prop.name),
					),
				);
				return;
			}
			const text = first.getText(file);
			const alias = text.split(".")[0];
			if (links.has(alias)) part.base = links.get(alias);
			return;
		}
		const alias = name.split(".")[0];
		if (links.has(alias)) part.base = links.get(alias);
	};

	for (const round of [0, 1]) {
		for (const [fileName, file] of sources) {
			const module = basename(fileName, ".tsx");
			const values = modules.get(module) ?? [];
			const links = baseLinks(file);
			const locals = new Map<string, ts.TypeNode>();
			file.forEachChild((node) => {
				if (ts.isTypeAliasDeclaration(node))
					locals.set(node.name.text, node.type);
			});
			const found = defaults(file);
			const parts: Part[] = [];
			file.forEachChild((node) => {
				if (
					!ts.isTypeAliasDeclaration(node) ||
					!node.name.text.endsWith("Props") ||
					!node.modifiers?.some(
						(modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
					)
				) {
					return;
				}
				const part: Part = {
					name: partName(node.name.text, values),
					props: [],
				};
				collect(file, node.type, locals, links, part);
				const initial = found.get(node.name.text);
				const seen = new Set<string>();
				part.props = part.props
					.filter((prop) => {
						if (seen.has(prop.name) || prop.name === "ref") return false;
						seen.add(prop.name);
						return true;
					})
					.map((prop) => ({ ...prop, default: initial?.get(prop.name) }));
				all.set(node.name.text, part.props);
				parts.push(part);
			});
			if (round === 1 && parts.length > 0) result[module] = parts;
		}
	}
	return result;
}

function registryItems() {
	const file = join(LIBRARY, "registry.json");
	if (!existsSync(file)) return {};
	const registry = JSON.parse(readFileSync(file, "utf8")) as {
		items: Array<{
			name: string;
			title?: string;
			description?: string;
			dependencies?: string[];
			registryDependencies?: string[];
			files: Array<{ path: string }>;
		}>;
	};
	return Object.fromEntries(
		registry.items.map((item) => [
			item.name,
			{
				title: item.title,
				description: item.description,
				dependencies: item.dependencies ?? [],
				registryDependencies: (item.registryDependencies ?? []).map((url) =>
					basename(url, ".json"),
				),
				files: item.files.map((entry) =>
					entry.path
						.replace(/^src\//, "")
						.replace(/^.*packages\/liquikit\//, ""),
				),
			},
		]),
	);
}

const HIGHLIGHT = "\0highlight:";
const DATA = "virtual:liquikit-docs";

export function docs(): Plugin {
	return {
		name: "liquikit-docs",
		enforce: "pre",
		async resolveId(source, importer) {
			if (source === DATA) return `\0${DATA}`;
			if (!source.endsWith("?highlight")) return;
			const resolved = await this.resolve(
				source.slice(0, -"?highlight".length),
				importer,
				{ skipSelf: true },
			);
			return resolved ? `${HIGHLIGHT}${resolved.id}` : undefined;
		},
		async load(id) {
			if (id === `\0${DATA}`) {
				for (const file of readdirSync(SOURCE)) {
					this.addWatchFile(join(SOURCE, file));
				}
				const registry = join(LIBRARY, "registry.json");
				if (existsSync(registry)) this.addWatchFile(registry);
				return `export const props = ${JSON.stringify(extractProps())};\nexport const registry = ${JSON.stringify(registryItems())};`;
			}
			if (!id.startsWith(HIGHLIGHT)) return;
			const path = id.slice(HIGHLIGHT.length);
			this.addWatchFile(path);
			const raw = readFileSync(path, "utf8");
			const code = path.startsWith(SOURCE) ? raw : rewriteImports(raw);
			const html = await highlight(code.trimEnd(), "tsx");
			return `export default ${JSON.stringify({ code: code.trimEnd(), html })};`;
		},
	};
}
