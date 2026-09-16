"use client";

import { type ReactNode, useCallback, useRef, useState } from "react";
import {
	GlassSegmentedSurface,
	type GlassSegmentedSurfaceProps,
} from "./glass-segmented-surface";
import "./glass-segmented.css";
import type { LensProfile } from "./optics";
import type { GlassTheme } from "./presets";
import { useGlassTheme } from "./theme";
import type { UseGlassSegmentedResult } from "./use-glass-segmented";

export type GlassToggleItem = {
	value: string;
	label: ReactNode;
	disabled?: boolean;
};

type Common = {
	options: ReadonlyArray<string | GlassToggleItem>;
	height?: number;
	lens?: Partial<LensProfile>;
	theme?: GlassTheme;
	disabled?: boolean;
	className?: string;
	"aria-label"?: string;
	surfaceProps?: Partial<GlassSegmentedSurfaceProps>;
};

export type GlassToggleGroupProps = Common &
	(
		| {
				type?: "single";
				value?: string | null;
				defaultValue?: string | null;
				onValueChange?: (value: string | null) => void;
		  }
		| {
				type: "multiple";
				value?: string[];
				defaultValue?: string[];
				onValueChange?: (value: string[]) => void;
		  }
	);

function normalise(option: string | GlassToggleItem): GlassToggleItem {
	return typeof option === "string" ? { value: option, label: option } : option;
}

export function GlassToggleGroup(props: GlassToggleGroupProps) {
	const {
		options,
		height = 36,
		lens,
		theme: themeProp,
		disabled,
		className,
		"aria-label": ariaLabel,
		surfaceProps,
	} = props;
	const theme = useGlassTheme(themeProp);
	const items = options.map(normalise);
	const multiple = props.type === "multiple";
	const controls = useRef<UseGlassSegmentedResult>(null);

	const [uncontrolledSingle, setUncontrolledSingle] = useState<string | null>(
		!multiple ? (props.defaultValue ?? null) : null,
	);
	const [uncontrolledMany, setUncontrolledMany] = useState<string[]>(
		multiple ? ((props.defaultValue as string[]) ?? []) : [],
	);

	const pressedValues = multiple
		? ((props.value as string[] | undefined) ?? uncontrolledMany)
		: [
				(props.value as string | null | undefined) ?? uncontrolledSingle ?? "",
			].filter(Boolean);

	const setPressed = useCallback(
		(value: string, next: boolean) => {
			if (props.type === "multiple") {
				const current = props.value ?? uncontrolledMany;
				const updated = next
					? items
							.map((item) => item.value)
							.filter((entry) =>
								entry === value ? true : current.includes(entry),
							)
					: current.filter((entry) => entry !== value);
				if (props.value === undefined) setUncontrolledMany(updated);
				props.onValueChange?.(updated);
				return;
			}
			const updated = next ? value : null;
			if (props.value === undefined) setUncontrolledSingle(updated);
			props.onValueChange?.(updated);
		},
		[items, props, uncontrolledMany],
	);

	const pressedFlags = items.map((item) => pressedValues.includes(item.value));
	const selected = pressedFlags.reduce<number[]>((all, on, index) => {
		if (on) all.push(index);
		return all;
	}, []);

	return (
		// biome-ignore lint/a11y/useSemanticElements: a group of toggle buttons, not a fieldset
		<div
			className={["glass-segmented", className].filter(Boolean).join(" ")}
			data-theme={theme}
			data-disabled={disabled ? "" : undefined}
			role="group"
			aria-label={ariaLabel}
		>
			<GlassSegmentedSurface
				{...surfaceProps}
				options={items}
				selected={selected}
				height={height}
				disabled={disabled}
				lens={lens}
				theme={theme}
				onDragSelect={
					multiple
						? undefined
						: (index) => {
								const item = items[index];
								if (item && !item.disabled && !pressedFlags[index]) {
									setPressed(item.value, true);
								}
							}
				}
				controlsRef={controls}
				items={(bounds) =>
					items.map((item, index) => (
						<button
							key={item.value}
							type="button"
							aria-pressed={pressedFlags[index]}
							disabled={disabled || item.disabled}
							className="glass-segmented__hit"
							data-state={pressedFlags[index] ? "on" : "off"}
							style={{
								left: bounds[index]?.left ?? 0,
								width: bounds[index]?.width ?? 0,
							}}
							onClick={() => {
								setPressed(item.value, !pressedFlags[index]);
								controls.current?.flash();
							}}
						>
							<span className="glass-segmented__hit-label">{item.label}</span>
						</button>
					))
				}
			/>
		</div>
	);
}
