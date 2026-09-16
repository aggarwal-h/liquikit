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
	DRAG_SLOP,
	DWELL,
	OPEN,
	rubberBand,
	TRAVEL,
} from "./motion";
import { MAX_SPREAD, MAX_STRETCH, squashed, useSquish } from "./use-squish";

const INSET_RATIO = 0.107;
const OVERSHOOT = 0.12;
const OPEN_HEIGHT = 1.45;
const OPEN_ASPECT = 1.5;

export type GlassSwitchGeometry = {
	width: number;
	height: number;
	inset: number;
	thumbWidth: number;
	thumbHeight: number;
	travel: number;
	margin: number;
	containerWidth: number;
	containerHeight: number;
};

export type UseGlassSwitchOptions = {
	checked: boolean;
	onCheckedChange?: (checked: boolean) => void;
	width?: number;
	height?: number;
	disabled?: boolean;
	draggable?: boolean;
	liquid?: number;
};

export type UseGlassSwitchResult = {
	geometry: GlassSwitchGeometry;
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
	thumbProps: {
		style: { x: MotionValue<number> };
		onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
		onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
		onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
		onPointerCancel: () => void;
	};
	rootRef: RefObject<HTMLElement | null>;
	trackRef: RefObject<HTMLElement | null>;
	flash: () => void;
	consumeDragGuard: () => boolean;
};

export function useGlassSwitch({
	checked,
	onCheckedChange,
	width = 74,
	height = 28,
	disabled,
	draggable = true,
	liquid = DEFAULT_LIQUID,
}: UseGlassSwitchOptions): UseGlassSwitchResult {
	const reduceMotion = useReducedMotion() ?? false;

	const inset = Math.round(height * INSET_RATIO);
	const thumbHeight = height - inset * 2;
	const thumbWidth = Math.round(thumbHeight * 2);
	const travel = width - thumbWidth - inset * 2;
	const overshoot = width * OVERSHOOT;

	const restHalfWidth = thumbWidth / 2;
	const restHalfHeight = thumbHeight / 2;
	const openHalfHeight = (height * OPEN_HEIGHT) / 2;
	const openHalfWidth = openHalfHeight * OPEN_ASPECT;
	const margin =
		Math.ceil(
			Math.max(
				openHalfWidth * MAX_SPREAD - restHalfWidth + overshoot,
				openHalfHeight * MAX_STRETCH - height / 2,
			),
		) + 2;

	const x = useMotionValue(checked ? travel : 0);
	const lensHalfWidth = useMotionValue(restHalfWidth);
	const lensHalfHeight = useMotionValue(restHalfHeight);
	const restProgress = useMotionValue(1);
	const shadowOpacity = useMotionValue(0);

	const { squish, lag, kick } = useSquish(x, !reduceMotion, liquid);

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
	const lensX = useTransform(x, (at) => margin + inset + thumbWidth / 2 + at);
	const edgeBias = useTransform(restProgress, (at) => at * 0.5);

	const rootRef = useRef<HTMLElement | null>(null);
	const trackRef = useRef<HTMLElement | null>(null);
	const pointer = useRef<number | null>(null);
	const startX = useRef(0);
	const startOffset = useRef(0);
	const dragged = useRef(false);
	const dragGuard = useRef(false);
	const isOpen = useRef(false);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);
	const travelAnimation = useRef<AnimationPlaybackControls | undefined>(
		undefined,
	);

	const setShape = useCallback(
		(open: boolean) => {
			isOpen.current = open;
			const options = open ? OPEN : CLOSE;
			const targets: Array<[typeof lensHalfWidth, number]> = [
				[lensHalfWidth, open ? openHalfWidth : restHalfWidth],
				[lensHalfHeight, open ? openHalfHeight : restHalfHeight],
				[restProgress, open ? 0 : 1],
				[shadowOpacity, open ? 1 : 0],
			];
			for (const [value, target] of targets) {
				if (reduceMotion) value.set(target);
				else animate(value, target, options);
			}
			kick(open ? 1 : -1);
		},
		[
			kick,
			lensHalfHeight,
			lensHalfWidth,
			openHalfHeight,
			openHalfWidth,
			reduceMotion,
			restHalfHeight,
			restHalfWidth,
			restProgress,
			shadowOpacity,
		],
	);

	const open = useCallback(() => {
		clearTimeout(closeTimer.current);
		if (!isOpen.current) setShape(true);
	}, [setShape]);

	const closeAfterDwell = useCallback(() => {
		clearTimeout(closeTimer.current);
		closeTimer.current = setTimeout(() => setShape(false), DWELL);
	}, [setShape]);

	const moveTo = useCallback(
		(target: number) => {
			travelAnimation.current?.stop();
			if (reduceMotion) x.set(target);
			else travelAnimation.current = animate(x, target, TRAVEL);
		},
		[reduceMotion, x],
	);

	const [rootStyle] = useState(() => ({
		"--switch-progress": String(checked ? 1 : 0),
	}));

	useEffect(() => {
		const apply = (value: number) => {
			const progress =
				travel > 0 ? Math.min(1, Math.max(0, value / travel)) : 0;
			rootRef.current?.style.setProperty("--switch-progress", String(progress));
		};
		apply(x.get());
		return x.on("change", apply);
	}, [travel, x]);

	useEffect(() => {
		if (pointer.current !== null) return;
		moveTo(checked ? travel : 0);
	}, [checked, moveTo, travel]);

	useEffect(
		() => () => {
			clearTimeout(closeTimer.current);
			travelAnimation.current?.stop();
		},
		[],
	);

	const pointerScale = () => {
		const box = trackRef.current?.getBoundingClientRect();
		return box && box.width > 0 ? box.width / width : 1;
	};

	const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
		if (disabled || pointer.current !== null || reduceMotion) return;
		pointer.current = event.pointerId;
		if (draggable) event.currentTarget.setPointerCapture(event.pointerId);
		startX.current = event.clientX;
		startOffset.current = x.get();
		dragged.current = false;
		dragGuard.current = false;
		travelAnimation.current?.stop();
		open();
		if (!draggable) closeAfterDwell();
	};

	const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
		if (!draggable || event.pointerId !== pointer.current) return;
		const scale = pointerScale();
		const moved = (event.clientX - startX.current) / scale;
		if (!dragged.current) {
			if (Math.abs(moved) < DRAG_SLOP) return;
			dragged.current = true;
			dragGuard.current = true;
			startOffset.current = x.get();
			startX.current = event.clientX;
		}
		let next = startOffset.current + (event.clientX - startX.current) / scale;
		if (next < 0) next = -rubberBand(-next, overshoot);
		else if (next > travel)
			next = travel + rubberBand(next - travel, overshoot);
		x.set(next);
	};

	const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
		if (event.pointerId !== pointer.current) return;
		pointer.current = null;
		closeAfterDwell();
		if (!dragged.current) return;

		dragged.current = false;
		const next = Math.max(0, Math.min(travel, x.get())) > travel / 2;
		moveTo(next ? travel : 0);
		if (next !== checked) onCheckedChange?.(next);
	};

	const onPointerCancel = () => {
		pointer.current = null;
		dragged.current = false;
		dragGuard.current = false;
		setShape(false);
		moveTo(checked ? travel : 0);
	};

	const flash = useCallback(() => {
		open();
		closeAfterDwell();
	}, [closeAfterDwell, open]);

	const consumeDragGuard = useCallback(() => {
		if (!dragGuard.current) return false;
		dragGuard.current = false;
		return true;
	}, []);

	return {
		rootStyle,
		geometry: {
			width,
			height,
			inset,
			thumbWidth,
			thumbHeight,
			travel,
			margin,
			containerWidth: width + margin * 2,
			containerHeight: height + margin * 2,
		},
		lensProps: {
			width: width + margin * 2,
			height: height + margin * 2,
			x: lensX,
			y: margin + height / 2,
			lensWidth,
			lensHeight,
			lensRadius,
			shadowOpacity,
			tintOpacity: restProgress,
			edgeBias,
			lag,
		},
		thumbProps: {
			style: { x },
			onPointerDown,
			onPointerMove,
			onPointerUp,
			onPointerCancel,
		},
		rootRef,
		trackRef,
		flash,
		consumeDragGuard,
	};
}
