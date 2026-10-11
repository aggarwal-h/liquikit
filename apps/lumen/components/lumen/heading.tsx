import type { ReactNode } from "react";

export function Heading({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<header className="mx-auto max-w-[740px] px-2 text-center">
			<h2 className="text-[clamp(36px,5.4vw,64px)] leading-[1.05] font-semibold tracking-[-0.035em]">
				{title}
			</h2>
			<p className="mx-auto mt-5 max-w-[34rem] text-[19px] leading-[1.42] text-(--muted) sm:text-[21px]">
				{children}
			</p>
		</header>
	);
}
