"use client";

import {
	type CSSProperties,
	type HTMLAttributes,
	type ReactNode,
	type Ref,
	useImperativeHandle,
} from "react";
import { Glass } from "./glass";
import "./glass-segmented.css";
import type { LensProfile } from "./optics";
import { type GlassTheme, toggleLens, useLens } from "./presets";
import { useGlassTheme } from "./theme";
import {
	type OptionBounds,
	type SegmentPress,
	type SegmentRun,
	type UseGlassSegmentedResult,
	useGlassSegmented,
	useSegmentLens,
} from "./use-glass-segmented";

export type GlassSegmentedOption = {
	value: string;
	label: ReactNode;
};

export type GlassSegmentedSurfaceProps = Omit<
	HTMLAttributes<HTMLSpanElement>,
	"children"
> & {
	options: ReadonlyArray<GlassSegmentedOption>;
	selected: readonly number[];
	height?: number;
	inset?: number;
	pressScale?: number;
	disabled?: boolean;
	lens?: Partial<LensProfile>;
	theme?: GlassTheme;
	liquid?: number;
	onDragSelect?: (index: number) => void;
	ref?: Ref<HTMLSpanElement>;
	controlsRef?: Ref<UseGlassSegmentedResult>;
	items?: (bounds: OptionBounds[]) => ReactNode;
};

export function GlassSegmentedSurface({
	options,
	selected,
	height = 36,
	inset,
	pressScale,
	disabled,
	lens: lensOverrides,
	theme: themeProp,
	liquid,
	onDragSelect,
	className,
	style,
	ref,
	controlsRef,
	items,
	...rest
}: GlassSegmentedSurfaceProps) {
	const theme = useGlassTheme(themeProp);
	const lens = useLens(theme, lensOverrides, toggleLens);
	const controls = useGlassSegmented({
		selected,
		optionCount: options.length,
		height,
		inset,
		pressScale,
		disabled,
		onDragSelect,
	});
	const {
		geometry,
		runs,
		dividers,
		bounds,
		attachRow,
		attachOption,
		rootRef,
		rootProps,
		press,
	} = controls;
	useImperativeHandle(controlsRef, () => controls, [controls]);

	const { margin, trackWidth, containerWidth, containerHeight } = geometry;
	const chosen = new Set(selected);

	const row = (highlighted: boolean, copy = false) => (
		<div
			className="glass-segmented__row"
			style={{ height, padding: `0 ${geometry.inset}px` }}
			data-highlighted={highlighted ? "" : undefined}
			aria-hidden="true"
			ref={highlighted || copy ? undefined : attachRow}
		>
			{options.map((option, index) => (
				<span
					key={option.value}
					data-option=""
					data-selected={chosen.has(index) ? "" : undefined}
					ref={highlighted || copy ? undefined : attachOption(index)}
					className="glass-segmented__option"
				>
					{option.label}
				</span>
			))}

			{highlighted
				? dividers.map((at) => (
						<span
							key={at}
							className="glass-segmented__divider"
							style={{ left: at }}
						/>
					))
				: null}
		</div>
	);

	return (
		<span
			{...rest}
			onPointerDown={(event) => {
				rest.onPointerDown?.(event);
				rootProps.onPointerDown(event);
			}}
			onPointerMove={(event) => {
				rest.onPointerMove?.(event);
				rootProps.onPointerMove(event);
			}}
			onPointerUp={(event) => {
				rest.onPointerUp?.(event);
				rootProps.onPointerUp(event);
			}}
			onPointerCancel={(event) => {
				rest.onPointerCancel?.(event);
				rootProps.onPointerCancel(event);
			}}
			ref={(element) => {
				rootRef.current = element;
				if (typeof ref === "function") ref(element);
				else if (ref) ref.current = element;
			}}
			className={["glass-segmented__box", className].filter(Boolean).join(" ")}
			data-theme={theme}
			data-disabled={disabled ? "" : undefined}
			data-measured={trackWidth > 0 ? "" : undefined}
			style={
				{
					...style,
					"--toggle-height": `${height}px`,
					"--segment-pill": `${geometry.indicatorHeight}px`,
					"--segment-shadow": lens.restEdgeShadow,
					"--segment-rest": "1",
				} as CSSProperties
			}
		>
			{row(false)}

			{trackWidth > 0
				? runs.map((run, position) => (
						<SegmentCapsule
							// biome-ignore lint/suspicious/noArrayIndexKey: that is the point
							key={position}
							run={run}
							indicatorHeight={geometry.indicatorHeight}
							margin={margin}
							trackHeight={height}
							containerWidth={containerWidth}
							containerHeight={containerHeight}
							press={press}
							liquid={liquid}
							lens={lens}
							plain={row(false, true)}
							face={row(true)}
						/>
					))
				: null}

			{items?.(bounds)}
		</span>
	);
}

function SegmentCapsule({
	run,
	indicatorHeight,
	margin,
	trackHeight,
	containerWidth,
	containerHeight,
	press,
	liquid,
	lens,
	plain,
	face,
}: {
	run: SegmentRun;
	indicatorHeight: number;
	margin: number;
	trackHeight: number;
	containerWidth: number;
	containerHeight: number;
	press: SegmentPress;
	liquid?: number;
	lens: LensProfile;
	plain: ReactNode;
	face: ReactNode;
}) {
	const lensProps = useSegmentLens({
		run,
		indicatorHeight,
		margin,
		press,
		liquid,
	});

	return (
		<Glass
			className="glass-segmented__glass"
			width={containerWidth}
			height={containerHeight}
			y={margin + trackHeight / 2}
			{...lensProps}
			style={{ margin: -margin }}
			lens={lens}
			tintColor="var(--glass-body)"
			relax
			refractionTarget={<div style={{ padding: margin }}>{plain}</div>}
			face={<div style={{ padding: margin }}>{face}</div>}
		/>
	);
}
