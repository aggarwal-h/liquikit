"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react/checkbox-group";
import type { ReactNode } from "react";
import { GlassPane, type GlassRefraction } from "./glass";
import { usePressGlass } from "./press";
import { cx, type GlassOptions } from "./types";
import "./liquikit.css";

export type CheckboxProps = Omit<
	BaseCheckbox.Root.Props,
	"className" | "render" | "children"
> &
	GlassOptions & {
		refraction?: GlassRefraction;
		className?: string;
		children?: ReactNode;
	};

export function Checkbox({
	children,
	theme,
	lens,
	liquid,
	refraction,
	className,
	disabled,
	onPointerDown,
	onPointerEnter,
	onPointerLeave,
	onKeyDown,
	onKeyUp,
	onBlur,
	...rootProps
}: CheckboxProps) {
	const { press, pressHandlers } = usePressGlass(disabled, {
		onPointerDown,
		onPointerEnter,
		onPointerLeave,
		onKeyDown,
		onKeyUp,
		onBlur,
	});

	const box = (
		<BaseCheckbox.Root
			{...rootProps}
			{...pressHandlers}
			disabled={disabled}
			className="glass-ui-check"
			render={(props, state) => {
				const on = state.checked || state.indeterminate;
				return (
					<span {...props}>
						<GlassPane
							radius={7}
							tint={on ? "var(--glass-accent)" : undefined}
							tintOpacity={on ? 1 : undefined}
							press={press}
							theme={theme}
							lens={lens}
							liquid={liquid}
							refraction={refraction}
						>
							<span className="glass-ui-check__box">{props.children}</span>
						</GlassPane>
					</span>
				);
			}}
		>
			<BaseCheckbox.Indicator keepMounted className="glass-ui-check__mark">
				<svg viewBox="0 0 16 16" aria-hidden="true">
					<path className="glass-ui-check__tick" d="M3.5 8.5l3 3 6-7" />
					<path className="glass-ui-check__dash" d="M4 8h8" />
				</svg>
			</BaseCheckbox.Indicator>
		</BaseCheckbox.Root>
	);

	if (!children) return <span className={cx(className)}>{box}</span>;
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: the checkbox inside is the control
		<label
			className={cx("glass-ui-choice", className)}
			data-disabled={disabled ? "" : undefined}
		>
			{box}
			<span className="glass-ui-choice__label">{children}</span>
		</label>
	);
}

export type CheckboxGroupProps = Omit<BaseCheckboxGroup.Props, "className"> & {
	className?: string;
};

export function CheckboxGroup({
	className,
	...groupProps
}: CheckboxGroupProps) {
	return (
		<BaseCheckboxGroup
			{...groupProps}
			className={cx("glass-ui-choices", className)}
		/>
	);
}
