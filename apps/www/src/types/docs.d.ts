declare module "*?highlight" {
	const source: { code: string; html: string };
	export default source;
}

declare module "virtual:liquikit-docs" {
	export type DocProp = {
		name: string;
		type: string;
		optional: boolean;
		default?: string;
	};
	export type DocPart = { name: string; props: DocProp[]; base?: string };
	export type RegistryEntry = {
		title?: string;
		description?: string;
		dependencies: string[];
		registryDependencies: string[];
		files: string[];
	};
	export const props: Record<string, DocPart[]>;
	export const registry: Record<string, RegistryEntry>;
}

declare module "*.mdx" {
	import type { MDXProps } from "mdx/types";
	export const frontmatter: Record<string, string>;
	export default function MDXContent(props: MDXProps): JSX.Element;
}
