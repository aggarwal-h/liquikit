import { type ComponentProps, createContext, useContext, useRef } from "react";
import { CopyButton } from "./copy-button";

const InBlock = createContext(false);

export function useInBlock() {
	return useContext(InBlock);
}

export function CodeBlock({
	className = "",
	style,
	children,
	...props
}: ComponentProps<"pre">) {
	const pre = useRef<HTMLPreElement>(null);
	return (
		<div className="code group relative my-5">
			<pre
				{...props}
				ref={pre}
				className={`${className} max-h-[560px] overflow-auto rounded-[14px] py-4 pr-12 pl-5 text-[13px] leading-[1.7] ring-1 ring-white/10`}
			>
				<InBlock.Provider value={true}>{children}</InBlock.Provider>
			</pre>
			<CopyButton
				value={() => pre.current?.textContent ?? ""}
				className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
			/>
		</div>
	);
}

export function Highlighted({
	html,
	code,
	className = "",
}: {
	html: string;
	code: string;
	className?: string;
}) {
	return (
		<div className={`code group relative ${className}`}>
			<div
				className="max-h-[520px] overflow-auto text-[13px] leading-[1.7] [&_pre]:py-4 [&_pre]:pr-12 [&_pre]:pl-5"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: build-time highlighted source
				dangerouslySetInnerHTML={{ __html: html }}
			/>
			<CopyButton
				value={() => code}
				className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
			/>
		</div>
	);
}
