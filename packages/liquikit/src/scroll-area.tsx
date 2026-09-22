"use client";

import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import { Separator as BaseSeparator } from "@base-ui/react/separator";
import type { CSSProperties, ReactNode } from "react";
import { cx } from "./types";
import "./liquikit.css";

export type ScrollAreaProps = Omit<
	BaseScrollArea.Root.Props,
	"className" | "style" | "children"
> & {
	horizontal?: boolean;
	className?: string;
	style?: CSSProperties;
	children?: ReactNode;
};

export function ScrollArea({
	horizontal = false,
	className,
	style,
	children,
	...rootProps
}: ScrollAreaProps) {
	return (
		<BaseScrollArea.Root
			{...rootProps}
			className={cx("glass-ui-scroll", className)}
			style={style}
		>
			<BaseScrollArea.Viewport className="glass-ui-scroll__viewport">
				<BaseScrollArea.Content>{children}</BaseScrollArea.Content>
			</BaseScrollArea.Viewport>
			<BaseScrollArea.Scrollbar
				orientation="vertical"
				className="glass-ui-scroll__bar"
			>
				<BaseScrollArea.Thumb className="glass-ui-scroll__thumb" />
			</BaseScrollArea.Scrollbar>
			{horizontal ? (
				<BaseScrollArea.Scrollbar
					orientation="horizontal"
					className="glass-ui-scroll__bar"
				>
					<BaseScrollArea.Thumb className="glass-ui-scroll__thumb" />
				</BaseScrollArea.Scrollbar>
			) : null}
		</BaseScrollArea.Root>
	);
}

export type SeparatorProps = Omit<BaseSeparator.Props, "className"> & {
	className?: string;
};

export function Separator({ className, ...props }: SeparatorProps) {
	return (
		<BaseSeparator {...props} className={cx("glass-ui-separator", className)} />
	);
}
