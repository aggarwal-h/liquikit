"use client";

import { useId, useRef, useState } from "react";
import {
	type GlassSegmentedOption,
	GlassSegmentedSurface,
	type GlassSegmentedSurfaceProps,
} from "./glass-segmented-surface";
import "./glass-segmented.css";
import type { LensProfile } from "./optics";
import type { GlassTheme } from "./presets";
import { useGlassTheme } from "./theme";
import type { UseGlassSegmentedResult } from "./use-glass-segmented";

export type { GlassSegmentedOption };

export type GlassSegmentedProps = {
	options: ReadonlyArray<string | GlassSegmentedOption>;
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	name?: string;
	height?: number;
	lens?: Partial<LensProfile>;
	theme?: GlassTheme;
	disabled?: boolean;
	className?: string;
	"aria-label"?: string;
	surfaceProps?: Partial<GlassSegmentedSurfaceProps>;
};

function normalise(
	option: string | GlassSegmentedOption,
): GlassSegmentedOption {
	return typeof option === "string" ? { value: option, label: option } : option;
}

export function GlassSegmented({
	options,
	value,
	defaultValue,
	onValueChange,
	name,
	height = 36,
	lens,
	theme: themeProp,
	disabled,
	className,
	"aria-label": ariaLabel,
	surfaceProps,
}: GlassSegmentedProps) {
	const theme = useGlassTheme(themeProp);
	const generatedId = useId();
	const groupName = name ?? `glass-toggle-${generatedId.replaceAll(":", "")}`;
	const items = options.map(normalise);
	const isControlled = value !== undefined;
	const [uncontrolled, setUncontrolled] = useState(
		defaultValue ?? items[0]?.value,
	);
	const current = isControlled ? value : uncontrolled;
	const selectedIndex = Math.max(
		0,
		items.findIndex((item) => item.value === current),
	);
	const controls = useRef<UseGlassSegmentedResult>(null);

	const select = (next: string) => {
		if (!isControlled) setUncontrolled(next);
		onValueChange?.(next);
		controls.current?.flash();
	};

	return (
		<div
			className={["glass-segmented", className].filter(Boolean).join(" ")}
			data-disabled={disabled ? "" : undefined}
			data-theme={theme}
			role="radiogroup"
			aria-label={ariaLabel}
		>
			<GlassSegmentedSurface
				{...surfaceProps}
				options={items}
				selected={[selectedIndex]}
				height={height}
				disabled={disabled}
				lens={lens}
				theme={theme}
				onDragSelect={(index) => {
					const item = items[index];
					if (item && item.value !== current) select(item.value);
				}}
				controlsRef={controls}
				items={(bounds) =>
					items.map((item, index) => (
						<label
							key={item.value}
							className="glass-segmented__hit"
							style={{
								left: bounds[index]?.left ?? 0,
								width: bounds[index]?.width ?? 0,
							}}
						>
							<input
								type="radio"
								name={groupName}
								value={item.value}
								checked={index === selectedIndex}
								disabled={disabled}
								className="glass-segmented__input"
								onChange={() => select(item.value)}
							/>
							<span className="glass-segmented__hit-label">{item.label}</span>
						</label>
					))
				}
			/>
		</div>
	);
}
