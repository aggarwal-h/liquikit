"use client";

import { type InputHTMLAttributes, useCallback, useId, useState } from "react";
import {
	GlassSliderSurface,
	type GlassSliderSurfaceProps,
} from "./glass-slider-surface";
import "./glass-slider.css";
import type { LensProfile } from "./optics";
import type { GlassTheme } from "./presets";
import { useGlassTheme } from "./theme";
import { clamp } from "./use-glass-slider";

type NativeProps = Omit<
	InputHTMLAttributes<HTMLInputElement>,
	"type" | "onChange" | "value" | "defaultValue" | "width" | "height" | "size"
>;

export type GlassSliderProps = NativeProps & {
	value?: number;
	defaultValue?: number;
	onValueChange?: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	label?: string;
	width?: number;
	trackHeight?: number;
	thumbHeight?: number;
	thumbWidth?: number;
	lens?: Partial<LensProfile>;
	theme?: GlassTheme;
	surfaceProps?: Partial<GlassSliderSurfaceProps>;
};

export function GlassSlider({
	value,
	defaultValue = 50,
	onValueChange,
	min = 0,
	max = 100,
	step = 1,
	label,
	width = 240,
	trackHeight = 6,
	thumbHeight = 22,
	thumbWidth,
	lens,
	theme: themeProp,
	disabled,
	className,
	id,
	surfaceProps,
	...inputProps
}: GlassSliderProps) {
	const theme = useGlassTheme(themeProp);
	const generatedId = useId();
	const inputId = id ?? generatedId;
	const isControlled = value !== undefined;
	const [uncontrolled, setUncontrolled] = useState(defaultValue);
	const current = clamp(isControlled ? value : uncontrolled, min, max);

	const commit = useCallback(
		(next: number) => {
			if (!isControlled) setUncontrolled(next);
			onValueChange?.(next);
		},
		[isControlled, onValueChange],
	);

	return (
		<label
			htmlFor={inputId}
			className={["glass-slider", className].filter(Boolean).join(" ")}
			data-disabled={disabled ? "" : undefined}
			data-theme={theme}
		>
			{label ? <span className="glass-slider__label">{label}</span> : null}
			<input
				{...inputProps}
				id={inputId}
				type="range"
				className="glass-slider__input"
				min={min}
				max={max}
				step={step}
				value={current}
				disabled={disabled}
				onChange={(event) => commit(Number(event.currentTarget.value))}
			/>
			<GlassSliderSurface
				{...surfaceProps}
				value={current}
				onValueChange={commit}
				min={min}
				max={max}
				step={step}
				width={width}
				trackHeight={trackHeight}
				thumbHeight={thumbHeight}
				thumbWidth={thumbWidth}
				disabled={disabled}
				lens={lens}
				theme={theme}
			/>
		</label>
	);
}
