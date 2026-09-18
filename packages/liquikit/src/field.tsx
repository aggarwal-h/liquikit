"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { Form as BaseForm } from "@base-ui/react/form";
import { Input as BaseInput } from "@base-ui/react/input";
import { animate, useMotionValue, useReducedMotion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { CLOSE, GlassPane, type GlassRefraction, OPEN } from "./glass";
import { cx, type GlassOptions } from "./types";
import "./liquikit.css";

const FOCUSED = 0.35;

export function useFocusGlass() {
	const reduceMotion = useReducedMotion() ?? false;
	const press = useMotionValue(0);
	const lift = (to: number) => {
		if (reduceMotion) press.set(to);
		else animate(press, to, to > press.get() ? OPEN : CLOSE);
	};
	return {
		press,
		onFocus: () => lift(FOCUSED),
		onBlur: () => lift(0),
	};
}

export type InputProps = Omit<
	BaseInput.Props,
	"className" | "style" | "render"
> &
	GlassOptions & {
		refraction?: GlassRefraction;
		leading?: ReactNode;
		className?: string;
		style?: CSSProperties;
	};

export function Input({
	theme,
	lens,
	liquid,
	refraction,
	leading,
	className,
	style,
	onFocus,
	onBlur,
	...inputProps
}: InputProps) {
	const focus = useFocusGlass();
	return (
		<div className={cx("glass-ui-input", className)} style={style}>
			<GlassPane
				radius={14}
				style={{ display: "block" }}
				press={focus.press}
				theme={theme}
				lens={lens}
				liquid={liquid}
				refraction={refraction}
			>
				<span className="glass-ui-input__row">
					{leading ? (
						<span className="glass-ui-input__leading" aria-hidden="true">
							{leading}
						</span>
					) : null}
					<BaseInput
						{...inputProps}
						className="glass-ui-input__control"
						onFocus={(event) => {
							onFocus?.(event);
							focus.onFocus();
						}}
						onBlur={(event) => {
							onBlur?.(event);
							focus.onBlur();
						}}
					/>
				</span>
			</GlassPane>
		</div>
	);
}

type Classed<P> = Omit<P, "className"> & { className?: string };

function Root({ className, ...props }: Classed<BaseField.Root.Props>) {
	return (
		<BaseField.Root {...props} className={cx("glass-ui-field", className)} />
	);
}

function Label({ className, ...props }: Classed<BaseField.Label.Props>) {
	return (
		<BaseField.Label
			{...props}
			className={cx("glass-ui-field__label", className)}
		/>
	);
}

function Description({
	className,
	...props
}: Classed<BaseField.Description.Props>) {
	return (
		<BaseField.Description
			{...props}
			className={cx("glass-ui-field__description", className)}
		/>
	);
}

export function FieldError({
	className,
	...props
}: Classed<BaseField.Error.Props>) {
	return (
		<BaseField.Error
			{...props}
			className={cx("glass-ui-field__error", className)}
		/>
	);
}

function Item({ className, ...props }: Classed<BaseField.Item.Props>) {
	return (
		<BaseField.Item
			{...props}
			className={cx("glass-ui-field__item", className)}
		/>
	);
}

export const Field = {
	Root,
	Label,
	Description,
	Error: FieldError,
	Item,
	Validity: BaseField.Validity,
};

export function FieldsetRoot({
	className,
	...props
}: Classed<BaseFieldset.Root.Props>) {
	return (
		<BaseFieldset.Root
			{...props}
			className={cx("glass-ui-fieldset", className)}
		/>
	);
}

function Legend({ className, ...props }: Classed<BaseFieldset.Legend.Props>) {
	return (
		<BaseFieldset.Legend
			{...props}
			className={cx("glass-ui-fieldset__legend", className)}
		/>
	);
}

export const Fieldset = { Root: FieldsetRoot, Legend };

export type FormProps = Classed<BaseForm.Props>;

export function Form({ className, ...props }: FormProps) {
	return <BaseForm {...props} className={cx("glass-ui-form", className)} />;
}

export const FieldRoot = Field.Root;
export const FieldLabel = Field.Label;
export const FieldDescription = Field.Description;
export const FieldItem = Field.Item;
export const FieldValidity = Field.Validity;
export const FieldsetLegend = Fieldset.Legend;
