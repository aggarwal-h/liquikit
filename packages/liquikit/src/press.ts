"use client";

import { animate, useMotionValue, useReducedMotion } from "motion/react";
import {
	type FocusEvent,
	type KeyboardEvent,
	type PointerEvent,
	useCallback,
	useEffect,
	useRef,
} from "react";
import { CLOSE, OPEN } from "./glass";

const HOVER = 0.25;

type PressHandlers<
	P extends PointerEvent<Element>,
	K extends KeyboardEvent<Element>,
	F extends FocusEvent<Element>,
> = {
	onPointerDown?: (event: P) => void;
	onPointerEnter?: (event: P) => void;
	onPointerLeave?: (event: P) => void;
	onKeyDown?: (event: K) => void;
	onKeyUp?: (event: K) => void;
	onBlur?: (event: F) => void;
};

export function usePressGlass<
	P extends PointerEvent<Element> = PointerEvent<HTMLElement>,
	K extends KeyboardEvent<Element> = KeyboardEvent<HTMLElement>,
	F extends FocusEvent<Element> = FocusEvent<HTMLElement>,
>(disabled: boolean | undefined, handlers: PressHandlers<P, K, F> = {}) {
	const press = useMotionValue(0);
	const reduceMotion = useReducedMotion() ?? false;
	const hovered = useRef(false);
	const held = useRef(false);
	const release = useRef<() => void>(() => {});

	const to = useCallback(
		(value: number) => {
			if (reduceMotion) press.set(value);
			else animate(press, value, value > press.get() ? OPEN : CLOSE);
		},
		[press, reduceMotion],
	);
	const settle = useCallback(() => {
		held.current = false;
		to(hovered.current ? HOVER : 0);
	}, [to]);

	useEffect(() => () => release.current(), []);

	const pressHandlers: Required<PressHandlers<P, K, F>> = {
		onPointerDown: (event) => {
			handlers.onPointerDown?.(event);
			if (disabled || event.button !== 0) return;
			held.current = true;
			to(1);
			release.current();
			const up = () => {
				release.current();
				settle();
			};
			window.addEventListener("pointerup", up);
			window.addEventListener("pointercancel", up);
			release.current = () => {
				window.removeEventListener("pointerup", up);
				window.removeEventListener("pointercancel", up);
				release.current = () => {};
			};
		},
		onPointerEnter: (event) => {
			handlers.onPointerEnter?.(event);
			if (event.pointerType !== "mouse" || disabled) return;
			hovered.current = true;
			if (!held.current) to(HOVER);
		},
		onPointerLeave: (event) => {
			handlers.onPointerLeave?.(event);
			hovered.current = false;
			if (!held.current) to(0);
		},
		onKeyDown: (event) => {
			handlers.onKeyDown?.(event);
			if (disabled || event.repeat) return;
			if (event.key === " " || event.key === "Enter") {
				held.current = true;
				to(1);
			}
		},
		onKeyUp: (event) => {
			handlers.onKeyUp?.(event);
			if (event.key === " " || event.key === "Enter") settle();
		},
		onBlur: (event) => {
			handlers.onBlur?.(event);
			if (held.current) settle();
		},
	};

	return { press, pressHandlers };
}
