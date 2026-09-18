"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import type { CSSProperties } from "react";
import { GlassPane, type GlassRefraction } from "./glass";
import { usePressGlass } from "./press";
import { cx, type GlassOptions } from "./types";
import "./liquikit.css";

export type ButtonProps = Omit<
	BaseButton.Props,
	"className" | "style" | "render"
> &
	GlassOptions & {
		variant?: "glass" | "prominent" | "clear";
		size?: "small" | "regular" | "large";
		icon?: boolean;
		block?: boolean;
		tint?: string;
		refraction?: GlassRefraction;
		className?: string;
		style?: CSSProperties;
	};

export function Button({
	variant = "glass",
	size = "regular",
	icon = false,
	block = false,
	tint,
	theme,
	lens,
	liquid,
	refraction,
	className,
	style,
	children,
	disabled,
	onPointerDown,
	onPointerEnter,
	onPointerLeave,
	onKeyDown,
	onKeyUp,
	onBlur,
	...buttonProps
}: ButtonProps) {
	const { press, pressHandlers } = usePressGlass(disabled, {
		onPointerDown,
		onPointerEnter,
		onPointerLeave,
		onKeyDown,
		onKeyUp,
		onBlur,
	});

	return (
		<BaseButton
			{...buttonProps}
			disabled={disabled}
			className={cx("glass-ui-button", className)}
			data-variant={variant}
			data-size={size}
			data-icon={icon ? "" : undefined}
			data-block={block ? "" : undefined}
			style={style}
			{...pressHandlers}
		>
			<GlassPane
				className="glass-ui-button__pane"
				variant={variant === "clear" ? "clear" : "regular"}
				tint={
					variant === "prominent" ? (tint ?? "var(--glass-accent)") : undefined
				}
				tintOpacity={variant === "prominent" ? 0.9 : undefined}
				press={press}
				theme={theme}
				lens={lens}
				liquid={liquid}
				refraction={refraction}
			>
				<span className="glass-ui-button__label">{children}</span>
			</GlassPane>
		</BaseButton>
	);
}
