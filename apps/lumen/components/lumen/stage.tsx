import type { HTMLAttributes, ReactNode } from "react";
import { GlassScope } from "@/components/liquikit/glass";
import { cn } from "@/lib/utils";

// Holds a lamp and clips its glow, padded by a third of the lamp. With `scope`
// it is a GlassScope, which Safari filters over the whole stage, so only the tile gets one.
export function Stage({
	className,
	layout,
	scope = false,
	children,
	...props
}: HTMLAttributes<HTMLDivElement> & {
	layout?: string;
	scope?: boolean;
	children: ReactNode;
}) {
	const box = cn(
		"relative mx-auto w-full overflow-hidden bg-(--page)",
		className,
	);
	if (scope) {
		return (
			<GlassScope className={box} {...props}>
				<div className={cn("relative", layout)}>{children}</div>
			</GlassScope>
		);
	}
	return (
		<div className={box} {...props}>
			<div className={cn("relative", layout)}>{children}</div>
		</div>
	);
}
