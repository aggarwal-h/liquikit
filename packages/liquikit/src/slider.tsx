"use client";

import { Slider as BaseSlider } from "@base-ui/react/slider";
import { type CSSProperties, useCallback, useRef, useState } from "react";
import { GlassSliderSurface, type UseGlassSliderResult } from "./glass";
import { cx, type GlassOptions } from "./types";
import "./liquikit.css";

export type SliderProps = Omit<
	BaseSlider.Root.Props,
	| "value"
	| "defaultValue"
	| "onValueChange"
	| "onValueCommitted"
	| "children"
	| "render"
	| "className"
	| "style"
	| "orientation"
	| "thumbAlignment"
	| "thumbCollisionBehavior"
	| "minStepsBetweenValues"
> &
	GlassOptions & {
		value?: number;
		defaultValue?: number;
		onValueChange?: (
			value: number,
			eventDetails: BaseSlider.Root.ChangeEventDetails,
		) => void;
		onValueCommitted?: (
			value: number,
			eventDetails: BaseSlider.Root.CommitEventDetails,
		) => void;
		width?: number;
		trackHeight?: number;
		thumbHeight?: number;
		thumbWidth?: number;
		"aria-label"?: string;
		className?: string;
		style?: CSSProperties;
	};

function single(value: number | readonly number[]) {
	return typeof value === "number" ? value : (value[0] ?? 0);
}

export function Slider({
	value,
	defaultValue,
	onValueChange,
	onValueCommitted,
	min = 0,
	max = 100,
	step = 1,
	width,
	trackHeight,
	thumbHeight = 22,
	thumbWidth,
	theme,
	lens,
	liquid,
	"aria-label": ariaLabel,
	className,
	style,
	...rootProps
}: SliderProps) {
	const controls = useRef<UseGlassSliderResult>(null);
	const [uncontrolled, setUncontrolled] = useState(defaultValue ?? min);
	const current = value ?? uncontrolled;
	const handleWidth = thumbWidth ?? Math.round(2 * thumbHeight);

	const press = useCallback(() => {
		controls.current?.setPressed(true);
		const release = () => {
			controls.current?.setPressed(false);
			window.removeEventListener("pointerup", release);
			window.removeEventListener("pointercancel", release);
		};
		window.addEventListener("pointerup", release);
		window.addEventListener("pointercancel", release);
	}, []);

	return (
		<BaseSlider.Root
			{...rootProps}
			value={current}
			onValueChange={(next, eventDetails) => {
				const number = single(next);
				if (value === undefined) setUncontrolled(number);
				onValueChange?.(number, eventDetails);
			}}
			onValueCommitted={(next, eventDetails) =>
				onValueCommitted?.(single(next), eventDetails)
			}
			min={min}
			max={max}
			step={step}
			thumbAlignment="edge"
			className={cx("glass-ui-slider", className)}
			data-fluid={width === undefined ? "" : undefined}
			style={width === undefined ? style : { ...style, width }}
		>
			<GlassSliderSurface
				value={current}
				min={min}
				max={max}
				step={step}
				width={width}
				trackHeight={trackHeight}
				thumbHeight={thumbHeight}
				thumbWidth={thumbWidth}
				disabled={rootProps.disabled}
				interactive={false}
				lens={lens}
				theme={theme}
				liquid={liquid}
				controlsRef={controls}
				overlay={
					<BaseSlider.Control
						className="glass-ui-slider__control"
						onPointerDown={rootProps.disabled ? undefined : press}
					>
						<BaseSlider.Track className="glass-ui-slider__track">
							<BaseSlider.Thumb
								className="glass-ui-slider__thumb"
								aria-label={ariaLabel}
								style={{ width: handleWidth, height: thumbHeight }}
							/>
						</BaseSlider.Track>
					</BaseSlider.Control>
				}
			/>
		</BaseSlider.Root>
	);
}
