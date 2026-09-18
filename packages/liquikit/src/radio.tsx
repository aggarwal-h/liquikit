"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { ReactNode } from "react";
import { GlassPane, type GlassRefraction } from "./glass";
import { usePressGlass } from "./press";
import { cx, type GlassOptions } from "./types";
import "./liquikit.css";

export type RadioProps = Omit<
	BaseRadio.Root.Props,
	"className" | "render" | "children"
> &
	GlassOptions & {
		refraction?: GlassRefraction;
		className?: string;
		children?: ReactNode;
	};

export function Radio({
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
}: RadioProps) {
	const { press, pressHandlers } = usePressGlass(disabled, {
		onPointerDown,
		onPointerEnter,
		onPointerLeave,
		onKeyDown,
		onKeyUp,
		onBlur,
	});

	const button = (
		<BaseRadio.Root
			{...rootProps}
			{...pressHandlers}
			disabled={disabled}
			className="glass-ui-radio"
			render={(props, state) => (
				<span {...props}>
					<GlassPane
						radius="capsule"
						tint={state.checked ? "var(--glass-accent)" : undefined}
						tintOpacity={state.checked ? 1 : undefined}
						press={press}
						theme={theme}
						lens={lens}
						liquid={liquid}
						refraction={refraction}
					>
						<span className="glass-ui-radio__box">{props.children}</span>
					</GlassPane>
				</span>
			)}
		>
			<BaseRadio.Indicator keepMounted className="glass-ui-radio__dot" />
		</BaseRadio.Root>
	);

	if (!children) return <span className={cx(className)}>{button}</span>;
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: the radio inside is the control
		<label
			className={cx("glass-ui-choice", className)}
			data-disabled={disabled ? "" : undefined}
		>
			{button}
			<span className="glass-ui-choice__label">{children}</span>
		</label>
	);
}

export type RadioGroupProps = Omit<BaseRadioGroup.Props, "className"> & {
	className?: string;
};

export function RadioGroup({ className, ...groupProps }: RadioGroupProps) {
	return (
		<BaseRadioGroup
			{...groupProps}
			className={cx("glass-ui-choices", className)}
		/>
	);
}
