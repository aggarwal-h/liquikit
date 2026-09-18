"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { type CSSProperties, useRef, useState } from "react";
import { GlassSegmentedSurface, type UseGlassSegmentedResult } from "./glass";
import { indicesOf, Name, over } from "./segments";
import { cx, type GlassOptions, type Segment, toSegment } from "./types";
import "./liquikit.css";

export type SegmentedControlProps = Omit<
	RadioGroup.Props,
	| "value"
	| "defaultValue"
	| "onValueChange"
	| "children"
	| "render"
	| "className"
	| "style"
> &
	GlassOptions & {
		options: ReadonlyArray<string | Segment>;
		value?: string;
		defaultValue?: string;
		onValueChange?: (
			value: string,
			eventDetails?: RadioGroup.ChangeEventDetails,
		) => void;
		height?: number;
		className?: string;
		style?: CSSProperties;
	};

export function SegmentedControl({
	options,
	value,
	defaultValue,
	onValueChange,
	height,
	theme,
	lens,
	liquid,
	disabled,
	className,
	style,
	...groupProps
}: SegmentedControlProps) {
	const segments = options.map(toSegment);
	const controls = useRef<UseGlassSegmentedResult>(null);
	const [uncontrolled, setUncontrolled] = useState(
		defaultValue ?? segments[0]?.value,
	);
	const current = value ?? uncontrolled;

	const choose = (
		chosen: string,
		eventDetails?: RadioGroup.ChangeEventDetails,
	) => {
		if (chosen === current) return;
		if (value === undefined) setUncontrolled(chosen);
		onValueChange?.(chosen, eventDetails);
	};

	return (
		<RadioGroup
			{...groupProps}
			value={current}
			onValueChange={(next, eventDetails) => {
				choose(String(next), eventDetails);
				controls.current?.flash();
			}}
			disabled={disabled}
			className={cx("glass-ui-segmented", className)}
			style={style}
		>
			<GlassSegmentedSurface
				options={segments}
				selected={indicesOf(segments, [current])}
				height={height}
				disabled={disabled}
				lens={lens}
				theme={theme}
				liquid={liquid}
				onDragSelect={(index) => {
					const segment = segments[index];
					if (segment && !segment.disabled) choose(segment.value);
				}}
				controlsRef={controls}
				items={(bounds) =>
					segments.map((segment, index) => (
						<Radio.Root
							key={segment.value}
							value={segment.value}
							disabled={segment.disabled}
							className="glass-segmented__hit glass-ui-item"
							style={over(bounds, index)}
						>
							<Name segment={segment} />
						</Radio.Root>
					))
				}
			/>
		</RadioGroup>
	);
}
