"use client";

import { Input } from "@base-ui/react/input";
import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { type CSSProperties, useRef, useState } from "react";
import { CLOSE, GlassPane, type GlassRefraction, OPEN } from "./glass";
import { cx, type GlassOptions } from "./types";
import "./liquikit.css";

const FOCUSED = 0.35;

export type SearchFieldProps = Omit<
	Input.Props,
	"className" | "style" | "type" | "render"
> &
	GlassOptions & {
		refraction?: GlassRefraction;
		className?: string;
		style?: CSSProperties;
	};

function setValueAsTyped(input: HTMLInputElement, value: string) {
	const setter = Object.getOwnPropertyDescriptor(
		HTMLInputElement.prototype,
		"value",
	)?.set;
	setter?.call(input, value);
	input.dispatchEvent(new Event("input", { bubbles: true }));
}

export function SearchField({
	value,
	defaultValue,
	onValueChange,
	placeholder = "Search",
	theme,
	lens,
	liquid,
	refraction,
	className,
	style,
	onFocus,
	onBlur,
	...inputProps
}: SearchFieldProps) {
	const reduceMotion = useReducedMotion() ?? false;
	const press = useMotionValue(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const [typed, setTyped] = useState(String(defaultValue ?? ""));
	const text = value === undefined ? typed : String(value);

	const lift = (to: number) => {
		if (reduceMotion) press.set(to);
		else animate(press, to, to > press.get() ? OPEN : CLOSE);
	};

	return (
		<div
			className={cx("glass-ui-search", className)}
			style={style}
			data-filled={text ? "" : undefined}
		>
			<GlassPane
				radius="capsule"
				style={{ display: "block" }}
				press={press}
				theme={theme}
				lens={lens}
				liquid={liquid}
				refraction={refraction}
			>
				<div
					className="glass-ui-search__row"
					onPointerDown={(event) => {
						if (event.target !== inputRef.current) {
							event.preventDefault();
							inputRef.current?.focus();
						}
					}}
				>
					<svg
						className="glass-ui-search__icon"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<circle cx="11" cy="11" r="6.5" />
						<path d="m16 16 4.5 4.5" />
					</svg>
					<Input
						{...inputProps}
						ref={inputRef}
						type="search"
						className="glass-ui-search__input"
						placeholder={placeholder}
						value={text}
						onValueChange={(next, eventDetails) => {
							if (value === undefined) setTyped(next);
							onValueChange?.(next, eventDetails);
						}}
						onFocus={(event) => {
							onFocus?.(event);
							lift(FOCUSED);
						}}
						onBlur={(event) => {
							onBlur?.(event);
							lift(0);
						}}
					/>
					<button
						type="button"
						className="glass-ui-search__clear"
						aria-label="Clear"
						tabIndex={-1}
						onClick={() => {
							const input = inputRef.current;
							if (!input) return;
							setValueAsTyped(input, "");
							input.focus();
						}}
					>
						<svg viewBox="0 0 16 16" aria-hidden="true">
							<path d="m5.5 5.5 5 5m0-5-5 5" />
						</svg>
					</button>
				</div>
			</GlassPane>
		</div>
	);
}
