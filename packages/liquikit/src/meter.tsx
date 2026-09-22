"use client";

import { Meter as BaseMeter } from "@base-ui/react/meter";
import { Progress as BaseProgress } from "@base-ui/react/progress";
import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";
import { cx, mergeRefs } from "./types";
import "./liquikit.css";

type BarProps = {
	label?: ReactNode;
	tint?: string;
	className?: string;
	style?: CSSProperties;
};

function useOffscreen() {
	const root = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const element = root.current;
		if (!element || typeof IntersectionObserver === "undefined") return;
		const observer = new IntersectionObserver(([entry]) => {
			element.toggleAttribute("data-offscreen", !entry.isIntersecting);
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	return root;
}

export type MeterProps = Omit<
	BaseMeter.Root.Props,
	"className" | "style" | "render" | "children"
> &
	BarProps;

export function Meter({
	label,
	tint,
	className,
	style,
	ref,
	...rootProps
}: MeterProps) {
	const root = useOffscreen();
	return (
		<BaseMeter.Root
			{...rootProps}
			ref={mergeRefs(ref, root)}
			className={cx("glass-ui-bar", className)}
			style={{ ...style, "--bar-tint": tint } as CSSProperties}
		>
			{label ? (
				<span className="glass-ui-bar__header">
					<BaseMeter.Label className="glass-ui-field__label">
						{label}
					</BaseMeter.Label>
					<BaseMeter.Value className="glass-ui-bar__value" />
				</span>
			) : null}
			<BaseMeter.Track className="glass-ui-bar__track">
				<BaseMeter.Indicator className="glass-ui-bar__fill" />
			</BaseMeter.Track>
		</BaseMeter.Root>
	);
}

export type ProgressProps = Omit<
	BaseProgress.Root.Props,
	"className" | "style" | "render" | "children"
> &
	BarProps;

export function Progress({
	label,
	tint,
	className,
	style,
	ref,
	...rootProps
}: ProgressProps) {
	const root = useOffscreen();
	return (
		<BaseProgress.Root
			{...rootProps}
			ref={mergeRefs(ref, root)}
			className={cx("glass-ui-bar", className)}
			style={{ ...style, "--bar-tint": tint } as CSSProperties}
		>
			{label ? (
				<span className="glass-ui-bar__header">
					<BaseProgress.Label className="glass-ui-field__label">
						{label}
					</BaseProgress.Label>
					<BaseProgress.Value className="glass-ui-bar__value" />
				</span>
			) : null}
			<BaseProgress.Track className="glass-ui-bar__track">
				<BaseProgress.Indicator className="glass-ui-bar__fill" />
			</BaseProgress.Track>
		</BaseProgress.Root>
	);
}
