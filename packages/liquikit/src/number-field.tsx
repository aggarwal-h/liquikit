"use client";

import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import { type CSSProperties, type ReactNode, useId } from "react";
import { useFocusGlass } from "./field";
import { GlassPane, type GlassRefraction } from "./glass";
import { cx, type GlassOptions } from "./types";
import "./liquikit.css";

export type NumberFieldProps = Omit<
	BaseNumberField.Root.Props,
	"className" | "style" | "render"
> &
	GlassOptions & {
		label?: ReactNode;
		refraction?: GlassRefraction;
		className?: string;
		style?: CSSProperties;
	};

export function NumberField({
	label,
	theme,
	lens,
	liquid,
	refraction,
	className,
	style,
	id,
	...rootProps
}: NumberFieldProps) {
	const generated = useId();
	const inputId = id ?? generated;
	const focus = useFocusGlass();
	return (
		<BaseNumberField.Root
			{...rootProps}
			id={inputId}
			className={cx("glass-ui-number", className)}
			style={style}
		>
			{label ? (
				<BaseNumberField.ScrubArea className="glass-ui-number__scrub">
					<label htmlFor={inputId} className="glass-ui-field__label">
						{label}
					</label>
					<BaseNumberField.ScrubAreaCursor className="glass-ui-number__cursor">
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M3 12h18" />
						</svg>
					</BaseNumberField.ScrubAreaCursor>
				</BaseNumberField.ScrubArea>
			) : null}
			<BaseNumberField.Group
				className="glass-ui-number__group"
				render={(props) => (
					<GlassPane
						{...props}
						radius="capsule"
						press={focus.press}
						theme={theme}
						lens={lens}
						liquid={liquid}
						refraction={refraction}
					/>
				)}
			>
				<span className="glass-ui-number__row">
					<BaseNumberField.Decrement
						className="glass-ui-number__step"
						aria-label="Decrease"
					>
						<svg viewBox="0 0 16 16" aria-hidden="true">
							<path d="M3.5 8h9" />
						</svg>
					</BaseNumberField.Decrement>
					<BaseNumberField.Input
						className="glass-ui-number__input"
						onFocus={focus.onFocus}
						onBlur={focus.onBlur}
					/>
					<BaseNumberField.Increment
						className="glass-ui-number__step"
						aria-label="Increase"
					>
						<svg viewBox="0 0 16 16" aria-hidden="true">
							<path d="M3.5 8h9M8 3.5v9" />
						</svg>
					</BaseNumberField.Increment>
				</span>
			</BaseNumberField.Group>
		</BaseNumberField.Root>
	);
}
