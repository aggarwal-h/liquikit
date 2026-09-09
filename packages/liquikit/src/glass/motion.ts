"use client";

import { type MotionValue, motionValue } from "motion/react";
import { useLayoutEffect, useState } from "react";

export const TRAVEL = {
	type: "spring",
	stiffness: 320,
	damping: 30,
	mass: 1,
} as const;

export const OPEN = {
	type: "spring",
	stiffness: 520,
	damping: 34,
	mass: 0.7,
} as const;

export const CLOSE = {
	type: "spring",
	stiffness: 260,
	damping: 30,
	mass: 1,
} as const;

export const DWELL = 260;

export const DEFAULT_LIQUID = 0.6;

export const DRAG_SLOP = 3;

export const PRESS_SCALE = 1.4;

export function rubberBand(distance: number, limit: number) {
	if (distance <= 0 || limit <= 0) return 0;
	return (1 - 1 / (distance / limit + 1)) * limit;
}

export function useDerived<T>(
	inputs: readonly MotionValue<number>[],
	compute: (values: number[]) => T,
): MotionValue<T> {
	const [value] = useState(() =>
		motionValue(compute(inputs.map((input) => input.get()))),
	);
	value.set(compute(inputs.map((input) => input.get())));
	useLayoutEffect(() => {
		const update = () => value.set(compute(inputs.map((input) => input.get())));
		update();
		const stops = inputs.map((input) => input.on("change", update));
		return () => {
			for (const stop of stops) stop();
		};
	});
	return value;
}
