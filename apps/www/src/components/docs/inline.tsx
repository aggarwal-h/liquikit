import type { ReactNode } from "react";

export function InlineCode({ children }: { children: ReactNode }) {
	return (
		<code className="rounded-[6px] bg-white/[0.08] px-[5px] py-[1px] font-mono text-[0.86em] text-white/90">
			{children}
		</code>
	);
}

export function Rich({ text }: { text: string }) {
	return (
		<>
			{text.split(/(`[^`]+`)/).map((piece, index) =>
				piece.startsWith("`") ? (
					// biome-ignore lint/suspicious/noArrayIndexKey: pieces of a fixed string
					<InlineCode key={index}>{piece.slice(1, -1)}</InlineCode>
				) : (
					piece
				),
			)}
		</>
	);
}
