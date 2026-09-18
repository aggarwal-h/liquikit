"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { type CSSProperties, useRef, useState } from "react";
import { GlassSegmentedSurface, type UseGlassSegmentedResult } from "./glass";
import { indicesOf, Name, over } from "./segments";
import { cx, type GlassOptions, type Segment, toSegment } from "./types";
import "./liquikit.css";

export type ToggleGroupProps = Omit<
	BaseToggleGroup.Props,
	| "value"
	| "defaultValue"
	| "onValueChange"
	| "children"
	| "render"
	| "className"
	| "style"
	| "orientation"
> &
	GlassOptions & {
		options: ReadonlyArray<string | Segment>;
		value?: string[];
		defaultValue?: string[];
		onValueChange?: (
			value: string[],
			eventDetails?: BaseToggleGroup.ChangeEventDetails,
		) => void;
		height?: number;
		className?: string;
		style?: CSSProperties;
	};

export function ToggleGroup({
	options,
	value,
	defaultValue = [],
	onValueChange,
	height,
	theme,
	lens,
	liquid,
	disabled,
	className,
	style,
	...groupProps
}: ToggleGroupProps) {
	const segments = options.map(toSegment);
	const controls = useRef<UseGlassSegmentedResult>(null);
	const [uncontrolled, setUncontrolled] = useState<string[]>(defaultValue);
	const current = value ?? uncontrolled;

	const press = (
		pressed: string[],
		eventDetails?: BaseToggleGroup.ChangeEventDetails,
	) => {
		if (value === undefined) setUncontrolled(pressed);
		onValueChange?.(pressed, eventDetails);
	};

	return (
		<BaseToggleGroup
			{...groupProps}
			value={current}
			onValueChange={(next, eventDetails) => {
				press(next.map(String), eventDetails);
				controls.current?.flash();
			}}
			disabled={disabled}
			className={cx("glass-ui-segmented", className)}
			style={style}
		>
			<GlassSegmentedSurface
				options={segments}
				selected={indicesOf(segments, current)}
				height={height}
				disabled={disabled}
				lens={lens}
				theme={theme}
				liquid={liquid}
				onDragSelect={
					groupProps.multiple
						? undefined
						: (index) => {
								const segment = segments[index];
								if (!segment || segment.disabled) return;
								if (current[0] !== segment.value) press([segment.value]);
							}
				}
				controlsRef={controls}
				items={(bounds) =>
					segments.map((segment, index) => (
						<Toggle
							key={segment.value}
							value={segment.value}
							disabled={segment.disabled}
							className="glass-segmented__hit glass-ui-item"
							style={over(bounds, index)}
						>
							<Name segment={segment} />
						</Toggle>
					))
				}
			/>
		</BaseToggleGroup>
	);
}
