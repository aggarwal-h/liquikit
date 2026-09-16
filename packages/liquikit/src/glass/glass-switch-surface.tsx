"use client";

import { motion } from "motion/react";
import {
	type CSSProperties,
	type HTMLAttributes,
	type Ref,
	useImperativeHandle,
} from "react";
import { Glass } from "./glass";
import "./glass-switch.css";
import type { LensProfile } from "./optics";
import { type GlassTheme, switchLens, useLens } from "./presets";
import { useGlassTheme } from "./theme";
import { type UseGlassSwitchResult, useGlassSwitch } from "./use-glass-switch";

export type GlassSwitchSurfaceProps = Omit<
	HTMLAttributes<HTMLSpanElement>,
	"onChange" | "children"
> & {
	checked: boolean;
	onCheckedChange?: (checked: boolean) => void;
	width?: number;
	height?: number;
	disabled?: boolean;
	draggable?: boolean;
	liquid?: number;
	lens?: Partial<LensProfile>;
	theme?: GlassTheme;
	ref?: Ref<HTMLSpanElement>;
	controlsRef?: Ref<UseGlassSwitchResult>;
};

export function GlassSwitchSurface({
	checked,
	onCheckedChange,
	width = 74,
	height = 28,
	disabled,
	draggable,
	liquid,
	lens: lensOverrides,
	theme: themeProp,
	className,
	style,
	ref,
	controlsRef,
	...rest
}: GlassSwitchSurfaceProps) {
	const theme = useGlassTheme(themeProp);
	const lens = useLens(theme, lensOverrides, switchLens);
	const controls = useGlassSwitch({
		checked,
		onCheckedChange,
		width,
		height,
		disabled,
		draggable,
		liquid,
	});
	const { geometry, lensProps, thumbProps, rootRef, trackRef, rootStyle } =
		controls;

	useImperativeHandle(controlsRef, () => controls, [controls]);

	return (
		<span
			{...rest}
			ref={(element) => {
				rootRef.current = element;
				if (typeof ref === "function") ref(element);
				else if (ref) ref.current = element;
			}}
			className={["glass-switch__box", className].filter(Boolean).join(" ")}
			data-theme={theme}
			data-disabled={disabled ? "" : undefined}
			style={{ ...rootStyle, ...style, width, height } as CSSProperties}
		>
			<Glass
				className="glass-switch__glass"
				{...lensProps}
				style={{ margin: -geometry.margin }}
				lens={lens}
				refractionTarget={
					<div style={{ padding: geometry.margin }}>
						<div
							className="glass-switch__track"
							style={{ width, height, borderRadius: height / 2 }}
						/>
					</div>
				}
			>
				<div style={{ padding: geometry.margin }}>
					<div
						ref={(element) => {
							trackRef.current = element;
						}}
						className="glass-switch__track"
						aria-hidden="true"
						style={{ width, height, borderRadius: height / 2 }}
					>
						<motion.span
							className="glass-switch__thumb-area"
							{...thumbProps}
							style={{
								...thumbProps.style,
								width: geometry.thumbWidth,
								height: geometry.thumbHeight,
								top: geometry.inset,
								left: geometry.inset,
							}}
						/>
					</div>
				</div>
			</Glass>
		</span>
	);
}
