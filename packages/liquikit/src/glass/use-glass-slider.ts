"use client";

import {
	type AnimationPlaybackControls,
	animate,
	type MotionValue,
	useMotionValue,
	useReducedMotion,
	useTransform,
} from "motion/react";
import {
	type PointerEvent as ReactPointerEvent,
	type RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	CLOSE,
	DEFAULT_LIQUID,
	OPEN,
	PRESS_SCALE,
	rubberBand,
	TRAVEL,
} from "./motion";
import { MAX_SPREAD, squashed, useSquish } from "./use-squish";

const OVERSHOOT = 0.06;

export function clamp(value: number, low: number, high: number) {
	return value < low ? low : value > high ? high : value;
}

function quantise(value: number, min: number, max: number, step: number) {
	if (step <= 0) return clamp(value, min, max);
	return clamp(min + Math.round((value - min) / step) * step, min, max);
}

function tidy(value: number, step: number) {
	const decimals = (String(step).split(".")[1] ?? "").length;
	return decimals > 0 ? Number(value.toFixed(decimals)) : value;
}

export type GlassSliderGeometry = {
	width: number;
	trackHeight: number;
	thumbWidth: number;
	thumbHeight: number;
	travel: number;
	margin: number;
	containerWidth: number;
	containerHeight: number;
};

export type UseGlassSliderOptions = {
	value: number;
	onValueChange?: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	width?: number;
	trackHeight?: number;
	thumbHeight?: number;
	thumbWidth?: number;
	disabled?: boolean;
	interactive?: boolean;
	liquid?: number;
};

export type UseGlassSliderResult = {
	geometry: GlassSliderGeometry;
	rootStyle: Record<string, string>;
	lensProps: {
		width: number;
		height: number;
		x: MotionValue<number>;
		y: number;
		lensWidth: MotionValue<number>;
		lensHeight: MotionValue<number>;
		lensRadius: MotionValue<number>;
		shadowOpacity: MotionValue<number>;
		tintOpacity: MotionValue<number>;
		edgeBias: MotionValue<number>;
		lag?: MotionValue<number>;
	};
	trackProps: {
		onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
		onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
		onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
		onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
	};
	rootRef: RefObject<HTMLElement | null>;
	hitRef: RefObject<HTMLElement | null>;
	setPressed: (pressed: boolean) => void;
};

export function useGlassSlider({
	value,
	onValueChange,
	min = 0,
	max = 100,
	step = 1,
	width = 240,
	trackHeight = 6,
	thumbHeight = 22,
	thumbWidth: thumbWidthProp,
	disabled,
	interactive = true,
	liquid = DEFAULT_LIQUID,
}: UseGlassSliderOptions): UseGlassSliderResult {
	const reduceMotion = useReducedMotion() ?? false;

	const thumbWidth = thumbWidthProp ?? Math.round(2 * thumbHeight);
	const travel = width - thumbWidth;
	const overshoot = width * OVERSHOOT;

	const restHalfWidth = thumbWidth / 2;
	const restHalfHeight = thumbHeight / 2;
	const margin =
		Math.ceil(
			Math.max(
				restHalfWidth * (PRESS_SCALE * MAX_SPREAD - 1),
				restHalfHeight * (PRESS_SCALE - 1),
			) + overshoot,
		) + 2;

	const span = max - min || 1;
	const offsetFor = useCallback(
		(next: number) => ((clamp(next, min, max) - min) / span) * travel,
		[max, min, span, travel],
	);

	const x = useMotionValue(offsetFor(value));
	const lensHalfWidth = useMotionValue(restHalfWidth);
	const lensHalfHeight = useMotionValue(restHalfHeight);
	const restProgress = useMotionValue(1);
	const shadowOpacity = useMotionValue(0);

	const { squish, lag, setHeld, kick } = useSquish(x, !reduceMotion, liquid);

	const lensWidth = useTransform(
		[lensHalfWidth, squish],
		([half, amount]: number[]) => squashed(half * 2, amount, true),
	);
	const lensHeight = useTransform(
		[lensHalfHeight, squish],
		([half, amount]: number[]) => squashed(half * 2, amount, false),
	);
	const lensRadius = useTransform(
		[lensWidth, lensHeight],
		([across, tall]: number[]) => Math.min(across, tall) / 2,
	);
	const lensX = useTransform(x, (at) => margin + thumbWidth / 2 + at);
	const edgeBias = useTransform(restProgress, (at) => at * 0.5);

	const rootRef = useRef<HTMLElement | null>(null);
	const hitRef = useRef<HTMLElement | null>(null);
	const pointer = useRef<number | null>(null);
	const dragging = useRef(false);
	const moveAnimation = useRef<AnimationPlaybackControls | undefined>(
		undefined,
	);

	const setShape = useCallback(
		(open: boolean) => {
			const factor = open ? PRESS_SCALE : 1;
			const options = open ? OPEN : CLOSE;
			const targets: Array<[typeof lensHalfWidth, number]> = [
				[lensHalfWidth, restHalfWidth * factor],
				[lensHalfHeight, restHalfHeight * factor],
				[restProgress, open ? 0 : 1],
				[shadowOpacity, open ? 1 : 0],
			];
			for (const [motionValue, target] of targets) {
				if (reduceMotion) motionValue.set(target);
				else animate(motionValue, target, options);
			}
			setHeld(open && !reduceMotion);
			if (open) kick(1);
		},
		[
			kick,
			lensHalfHeight,
			lensHalfWidth,
			reduceMotion,
			restHalfHeight,
			restHalfWidth,
			restProgress,
			setHeld,
			shadowOpacity,
		],
	);

	const [rootStyle] = useState(() => {
		const progress = travel > 0 ? clamp(x.get() / travel, 0, 1) : 0;
		return {
			"--slider-fill": `${progress * width}px`,
			"--slider-progress": String(progress),
		};
	});

	useEffect(() => {
		const apply = (at: number) => {
			const root = rootRef.current;
			if (!root) return;
			const progress = travel > 0 ? clamp(at / travel, 0, 1) : 0;
			root.style.setProperty("--slider-fill", `${progress * width}px`);
			root.style.setProperty("--slider-progress", String(progress));
		};
		apply(x.get());
		return x.on("change", apply);
	}, [travel, width, x]);

	useEffect(() => {
		if (dragging.current) return;
		const target = offsetFor(value);
		moveAnimation.current?.stop();
		if (reduceMotion) x.set(target);
		else moveAnimation.current = animate(x, target, TRAVEL);
	}, [offsetFor, reduceMotion, value, x]);

	useEffect(
		() => () => {
			moveAnimation.current?.stop();
		},
		[],
	);

	const offsetAt = useCallback(
		(clientX: number) => {
			const hit = hitRef.current;
			if (!hit) return x.get();
			const box = hit.getBoundingClientRect();
			const scale = box.width > 0 ? box.width / width : 1;
			return (clientX - box.left) / scale - thumbWidth / 2;
		},
		[thumbWidth, width, x],
	);

	const valueAt = useCallback(
		(offset: number) => {
			const at = clamp(offset, 0, travel);
			const raw = min + (travel > 0 ? at / travel : 0) * span;
			return tidy(quantise(raw, min, max, step), step);
		},
		[max, min, span, step, travel],
	);

	const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
		if (disabled || pointer.current !== null) return;
		pointer.current = event.pointerId;
		setShape(true);
		if (!interactive) return;
		event.currentTarget.setPointerCapture(event.pointerId);
		dragging.current = true;
		moveAnimation.current?.stop();
		const offset = offsetAt(event.clientX);
		x.set(clamp(offset, 0, travel));
		const next = valueAt(offset);
		if (next !== value) onValueChange?.(next);
	};

	const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
		if (event.pointerId !== pointer.current || !interactive) return;
		const offset = offsetAt(event.clientX);
		let position = offset;
		if (position < 0) position = -rubberBand(-position, overshoot);
		else if (position > travel) {
			position = travel + rubberBand(position - travel, overshoot);
		}
		x.set(position);
		const next = valueAt(offset);
		if (next !== value) onValueChange?.(next);
	};

	const endPointer = (event: ReactPointerEvent<HTMLElement>) => {
		if (event.pointerId !== pointer.current) return;
		pointer.current = null;
		dragging.current = false;
		setShape(false);
		if (!interactive) return;
		const settled = offsetFor(valueAt(clamp(x.get(), 0, travel)));
		moveAnimation.current?.stop();
		if (reduceMotion) x.set(settled);
		else moveAnimation.current = animate(x, settled, TRAVEL);
	};

	return {
		rootStyle,
		geometry: {
			width,
			trackHeight,
			thumbWidth,
			thumbHeight,
			travel,
			margin,
			containerWidth: width + margin * 2,
			containerHeight: thumbHeight + margin * 2,
		},
		lensProps: {
			width: width + margin * 2,
			height: thumbHeight + margin * 2,
			x: lensX,
			y: margin + thumbHeight / 2,
			lensWidth,
			lensHeight,
			lensRadius,
			shadowOpacity,
			tintOpacity: restProgress,
			edgeBias,
			lag,
		},
		trackProps: {
			onPointerDown,
			onPointerMove,
			onPointerUp: endPointer,
			onPointerCancel: endPointer,
		},
		rootRef,
		hitRef,
		setPressed: setShape,
	};
}
