"use client";

import {
	type CSSProperties,
	type HTMLAttributes,
	type ReactNode,
	type Ref,
	useImperativeHandle,
	useLayoutEffect,
	useState,
} from "react";
import { Glass } from "./glass";
import "./glass-slider.css";
import type { LensProfile } from "./optics";
import { type GlassTheme, sliderLens, useLens } from "./presets";
import { useGlassTheme } from "./theme";
import {
	type UseGlassSliderOptions,
	type UseGlassSliderResult,
	useGlassSlider,
} from "./use-glass-slider";

export type GlassSliderSurfaceProps = Omit<
	HTMLAttributes<HTMLSpanElement>,
	"onChange" | "children" | "defaultValue"
> &
	UseGlassSliderOptions & {
		lens?: Partial<LensProfile>;
		theme?: GlassTheme;
		ref?: Ref<HTMLSpanElement>;
		overlay?: ReactNode;
		controlsRef?: Ref<UseGlassSliderResult>;
	};

// What a slider with no width is laid out at before it has measured itself.
const FALLBACK_WIDTH = 240;

export function GlassSliderSurface({
	lens: lensOverrides,
	theme: themeProp,
	className,
	style,
	ref,
	overlay,
	controlsRef,
	...options
}: GlassSliderSurfaceProps) {
	const theme = useGlassTheme(themeProp);
	const lens = useLens(theme, lensOverrides, sliderLens);
	// With no width the slider fills its container, at the width it measures.
	const fluid = options.width === undefined;
	const [measured, setMeasured] = useState<number | null>(null);
	const controls = useGlassSlider({
		...options,
		width: options.width ?? measured ?? FALLBACK_WIDTH,
	});
	const { geometry, lensProps, trackProps, rootRef, hitRef, rootStyle } =
		controls;
	useImperativeHandle(controlsRef, () => controls, [controls]);
	const { width, thumbWidth, thumbHeight, trackHeight, margin } = geometry;

	useLayoutEffect(() => {
		const box = rootRef.current;
		if (!fluid || !box) return;
		// Layout width, so a scaled ancestor, such as a popup growing in, is
		// measured at its real size.
		const measure = () => {
			if (box.offsetWidth > 0) setMeasured(box.offsetWidth);
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(box);
		return () => observer.disconnect();
	}, [fluid, rootRef]);

	const track = (
		<div
			className="glass-slider__track"
			style={{ height: trackHeight, borderRadius: trackHeight / 2 }}
		>
			<div className="glass-slider__track-fill" />
		</div>
	);

	return (
		<span
			ref={(element) => {
				rootRef.current = element;
				if (typeof ref === "function") ref(element);
				else if (ref) ref.current = element;
			}}
			className={["glass-slider__box", className].filter(Boolean).join(" ")}
			data-theme={theme}
			data-disabled={options.disabled ? "" : undefined}
			style={
				{
					...rootStyle,
					...style,
					width: fluid ? undefined : width,
					height: thumbHeight,
					"--slider-thumb-width": `${thumbWidth}px`,
				} as CSSProperties
			}
		>
			{fluid && measured === null ? (
				<>
					<div className="glass-slider__row" style={{ height: thumbHeight }}>
						{track}
					</div>
					<span
						className="glass-slider__rest"
						style={{ boxShadow: lens.restEdgeShadow }}
					/>
				</>
			) : (
				<Glass
					className="glass-slider__glass"
					{...lensProps}
					style={{ margin: -margin }}
					lens={lens}
					refractionTarget={
						<div style={{ padding: margin }}>
							<div
								className="glass-slider__row"
								style={{ width, height: thumbHeight }}
							>
								{track}
							</div>
						</div>
					}
				>
					<div style={{ padding: margin }}>
						<div
							ref={(element) => {
								hitRef.current = element;
							}}
							className="glass-slider__row glass-slider__hit"
							aria-hidden="true"
							style={{ width, height: thumbHeight }}
							{...trackProps}
						>
							{track}
						</div>
					</div>
				</Glass>
			)}
			{overlay}
		</span>
	);
}
