"use client";

import {
	type InputHTMLAttributes,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import {
	GlassSwitchSurface,
	type GlassSwitchSurfaceProps,
} from "./glass-switch-surface";
import type { LensProfile } from "./optics";
import type { GlassTheme } from "./presets";
import { useGlassTheme } from "./theme";
import type { UseGlassSwitchResult } from "./use-glass-switch";

type NativeProps = Omit<
	InputHTMLAttributes<HTMLInputElement>,
	"type" | "onChange" | "size" | "width" | "height"
>;

export type GlassSwitchProps = NativeProps & {
	onCheckedChange?: (checked: boolean) => void;
	label?: string;
	width?: number;
	height?: number;
	lens?: Partial<LensProfile>;
	theme?: GlassTheme;
	surfaceProps?: Partial<GlassSwitchSurfaceProps>;
};

export function GlassSwitch({
	checked,
	defaultChecked = false,
	onCheckedChange,
	label,
	width = 74,
	height = 28,
	lens,
	theme: themeProp,
	disabled,
	className,
	id,
	surfaceProps,
	...inputProps
}: GlassSwitchProps) {
	const theme = useGlassTheme(themeProp);
	const generatedId = useId();
	const inputId = id ?? generatedId;
	const isControlled = checked !== undefined;
	const [uncontrolled, setUncontrolled] = useState(defaultChecked);
	const isChecked = Boolean(isControlled ? checked : uncontrolled);

	const controls = useRef<UseGlassSwitchResult>(null);
	const committed = useRef(isChecked);
	useEffect(() => {
		committed.current = isChecked;
	}, [isChecked]);

	const commit = useCallback(
		(next: boolean) => {
			committed.current = next;
			if (!isControlled) setUncontrolled(next);
			onCheckedChange?.(next);
		},
		[isControlled, onCheckedChange],
	);

	return (
		<label
			htmlFor={inputId}
			className={["glass-switch", className].filter(Boolean).join(" ")}
			data-disabled={disabled ? "" : undefined}
			data-theme={theme}
		>
			<input
				{...inputProps}
				id={inputId}
				type="checkbox"
				role="switch"
				aria-checked={isChecked}
				className="glass-switch__input"
				checked={isChecked}
				disabled={disabled}
				onChange={(event) => {
					if (controls.current?.consumeDragGuard()) {
						event.currentTarget.checked = committed.current;
						return;
					}
					commit(event.currentTarget.checked);
					controls.current?.flash();
				}}
			/>

			<GlassSwitchSurface
				{...surfaceProps}
				checked={isChecked}
				onCheckedChange={commit}
				width={width}
				height={height}
				disabled={disabled}
				lens={lens}
				theme={theme}
				controlsRef={controls}
			/>
			{label ? <span className="glass-switch__label">{label}</span> : null}
		</label>
	);
}
