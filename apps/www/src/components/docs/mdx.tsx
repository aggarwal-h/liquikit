import { Link } from "@tanstack/react-router";
import { Info } from "lucide-react";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps, ReactNode } from "react";
import { CodeBlock, useInBlock } from "./code-block";
import { InlineCode } from "./inline";
import { Install } from "./install";
import { ComponentPreview } from "./preview";
import { Props } from "./props-table";

function Heading({
	as: Tag,
	id,
	children,
	className,
}: {
	as: "h2" | "h3";
	id?: string;
	children?: ReactNode;
	className: string;
}) {
	return (
		<Tag id={id} className={`group scroll-mt-24 ${className}`}>
			<a href={`#${id}`} className="no-underline">
				{children}
				<span className="ml-2 text-white/25 opacity-0 transition-opacity group-hover:opacity-100">
					#
				</span>
			</a>
		</Tag>
	);
}

function Anchor({ href = "", children, ...props }: ComponentProps<"a">) {
	const style =
		"text-white underline decoration-white/30 underline-offset-[3px] transition-colors hover:decoration-white";
	if (href.startsWith("/")) {
		return (
			<Link to={href} className={style}>
				{children}
			</Link>
		);
	}
	return (
		<a {...props} href={href} className={style}>
			{children}
		</a>
	);
}

function Code({ children, ...props }: ComponentProps<"code">) {
	const inBlock = useInBlock();
	if (inBlock) return <code {...props}>{children}</code>;
	return <InlineCode>{children}</InlineCode>;
}

export function Callout({ children }: { children: ReactNode }) {
	return (
		<div className="my-6 flex gap-3 rounded-[14px] bg-[color-mix(in_oklab,var(--neon)_12%,transparent)] p-4 text-[14.5px] leading-[1.65] text-white/80 ring-1 ring-[color-mix(in_oklab,var(--neon)_40%,transparent)] [&_p]:m-0">
			<Info className="mt-[3px] size-4 shrink-0 text-[var(--neon-hot)]" />
			<div>{children}</div>
		</div>
	);
}

export function Steps({ children }: { children: ReactNode }) {
	return (
		<div className="steps my-6 ml-3 border-l border-white/10 pl-7 [counter-reset:step]">
			{children}
		</div>
	);
}

export const mdxComponents: MDXComponents = {
	h2: ({ id, children }) => (
		<Heading
			as="h2"
			id={id}
			className="mt-14 mb-4 border-b border-white/[0.08] pb-3 text-[24px] font-semibold tracking-[-0.02em] text-white first:mt-0"
		>
			{children}
		</Heading>
	),
	h3: ({ id, children }) => (
		<Heading
			as="h3"
			id={id}
			className="mt-10 mb-3 text-[18px] font-semibold tracking-[-0.01em] text-white"
		>
			{children}
		</Heading>
	),
	p: (props) => (
		<p {...props} className="my-4 text-[15.5px] leading-[1.75] text-white/70" />
	),
	ul: (props) => (
		<ul
			{...props}
			className="my-4 ml-5 list-disc space-y-2 text-[15.5px] leading-[1.7] text-white/70 marker:text-white/30"
		/>
	),
	ol: (props) => (
		<ol
			{...props}
			className="my-4 ml-5 list-decimal space-y-2 text-[15.5px] leading-[1.7] text-white/70 marker:text-white/50"
		/>
	),
	strong: (props) => <strong {...props} className="font-semibold text-white" />,
	a: Anchor,
	code: Code,
	pre: (props) => <CodeBlock {...props} />,
	table: (props) => (
		<div className="my-6 overflow-x-auto rounded-[14px] ring-1 ring-white/10">
			<table {...props} className="w-full text-left text-[14px]" />
		</div>
	),
	thead: (props) => (
		<thead {...props} className="bg-white/[0.03] text-white/55" />
	),
	th: (props) => <th {...props} className="px-4 py-2.5 font-medium" />,
	td: (props) => (
		<td
			{...props}
			className="border-t border-white/[0.07] px-4 py-3 text-white/70"
		/>
	),
	hr: () => <hr className="my-12 border-white/10" />,
	ComponentPreview,
	Install,
	Props,
	Callout,
	Steps,
};
