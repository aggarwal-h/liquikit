"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { type CSSProperties, useRef, useState } from "react";
import { GlassSwitchSurface, type UseGlassSwitchResult } from "./glass";
import { cx, type GlassOptions } from "./types";
import "./liquikit.css";

export type SwitchProps = Omit<
	BaseSwitch.Root.Props,
	"children" | "render" | "className" | "style" | "onCheckedChange"
> &
	GlassOptions & {
		onCheckedChange?: (
			checked: boolean,
			eventDetails?: BaseSwitch.Root.ChangeEventDetails,
		) => void;
		width?: number;
		height?: number;
		className?: string;
		style?: CSSProperties;
	};

export function Switch({
	checked,
	defaultChecked = false,
	onCheckedChange,
	width,
	height,
	theme,
	lens,
	liquid,
	className,
	...rootProps
}: SwitchProps) {
	const controls = useRef<UseGlassSwitchResult>(null);
	const [uncontrolled, setUncontrolled] = useState(defaultChecked);
	const current = checked ?? uncontrolled;

	const commit = (
		next: boolean,
		eventDetails?: BaseSwitch.Root.ChangeEventDetails,
	) => {
		if (checked === undefined) setUncontrolled(next);
		onCheckedChange?.(next, eventDetails);
	};

	return (
		<BaseSwitch.Root
			{...rootProps}
			checked={current}
			onCheckedChange={(next, eventDetails) => {
				if (controls.current?.consumeDragGuard()) {
					eventDetails.cancel();
					return;
				}
				commit(next, eventDetails);
				controls.current?.flash();
			}}
			className={cx("glass-ui-root glass-ui-switch", className)}
		>
			<GlassSwitchSurface
				checked={current}
				onCheckedChange={(next) => commit(next)}
				width={width}
				height={height}
				disabled={rootProps.disabled}
				draggable={!rootProps.readOnly}
				lens={lens}
				theme={theme}
				liquid={liquid}
				controlsRef={controls}
			/>
		</BaseSwitch.Root>
	);
}
