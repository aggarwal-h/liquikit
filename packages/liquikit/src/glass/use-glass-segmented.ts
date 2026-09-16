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
	useMemo,
	useRef,
	useState,
} from "react";
import {
	CLOSE,
	DEFAULT_LIQUID,
	DRAG_SLOP,
	OPEN,
	PRESS_SCALE,
	rubberBand,
	TRAVEL,
	useDerived,
} from "./motion";
import { MAX_SPREAD, MAX_STRETCH, squashed, useSquish } from "./use-squish";

const INSET_RATIO = 0.107;
const PRESS_HEIGHT = PRESS_SCALE;
const SETTLE = 340;
const OVERDRAG = 0.35;
const SPEED_STRETCH = -0.25;

export type OptionBounds = { left: number; width: number };

export type SegmentRun = {
	start: number;
	end: number;
	left: number;
	width: number;
};

export type SegmentPress = {
	stretch: MotionValue<number>;
	shadowOpacity: MotionValue<number>;
	rest: MotionValue<number>;
	held: MotionValue<number>;
	drag: MotionValue<number>;
	dragWidth: MotionValue<number>;
};

export type UseGlassSegmentedOptions = {
	selected: readonly number[];
	optionCount: number;
	height?: number;
	inset?: number;
	pressScale?: number;
	disabled?: boolean;
	onDragSelect?: (index: number) => void;
};

export type UseGlassSegmentedResult = {
	geometry: {
		height: number;
		inset: number;
		indicatorHeight: number;
		margin: number;
		trackWidth: number;
		containerWidth: number;
		containerHeight: number;
	};
	runs: SegmentRun[];
	dividers: number[];
	bounds: OptionBounds[];
	attachRow: (element: HTMLElement | null) => void;
	attachOption: (index: number) => (element: HTMLElement | null) => void;
	rootRef: RefObject<HTMLElement | null>;
	rootProps: {
		onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
		onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
		onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
		onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
	};
	press: SegmentPress;
	flash: () => void;
	setPressed: (pressed: boolean) => void;
};

function runsOf(
	selected: readonly number[],
	bounds: OptionBounds[],
): SegmentRun[] {
	const sorted = [...new Set(selected)]
		.filter((index) => index >= 0 && bounds[index] !== undefined)
		.sort((a, b) => a - b);

	const runs: SegmentRun[] = [];
	for (const index of sorted) {
		const open = runs.at(-1);
		if (open && index === open.end + 1) {
			open.end = index;
			continue;
		}
		runs.push({ start: index, end: index, left: 0, width: 0 });
	}

	return runs.map((run) => {
		const first = bounds[run.start];
		const last = bounds[run.end];
		return {
			...run,
			left: first.left,
			width: last.left + last.width - first.left,
		};
	});
}

const centreOf = (bound: OptionBounds) => bound.left + bound.width / 2;

function capsuleAt(bounds: OptionBounds[], centre: number) {
	const first = bounds[0];
	const last = bounds.at(-1);
	if (!first || !last) return { centre, width: 0 };
	if (centre <= centreOf(first)) return { centre, width: first.width };
	if (centre >= centreOf(last)) return { centre, width: last.width };
	for (let index = 0; index < bounds.length - 1; index += 1) {
		const from = bounds[index];
		const to = bounds[index + 1];
		if (centre > centreOf(to)) continue;
		const t = (centre - centreOf(from)) / (centreOf(to) - centreOf(from));
		return { centre, width: from.width + (to.width - from.width) * t };
	}
	return { centre, width: last.width };
}

function nearestTo(bounds: OptionBounds[], centre: number) {
	let best = 0;
	for (let index = 1; index < bounds.length; index += 1) {
		const distance = Math.abs(centreOf(bounds[index]) - centre);
		if (distance < Math.abs(centreOf(bounds[best]) - centre)) best = index;
	}
	return best;
}

export function useGlassSegmented({
	selected,
	optionCount,
	height = 36,
	inset: insetOption,
	pressScale = PRESS_HEIGHT,
	disabled,
	onDragSelect,
}: UseGlassSegmentedOptions): UseGlassSegmentedResult {
	const reduceMotion = useReducedMotion() ?? false;

	const inset = insetOption ?? Math.round(height * INSET_RATIO);
	const indicatorHeight = height - inset * 2;
	const margin =
		Math.ceil(
			Math.max(
				((indicatorHeight * pressScale) / 2) * MAX_STRETCH - height / 2,
				(indicatorHeight * (pressScale - 1)) / 2 +
					indicatorHeight * (MAX_SPREAD - 1),
			),
		) + 2;

	const [bounds, setBounds] = useState<OptionBounds[]>([]);
	const [trackWidth, setTrackWidth] = useState(0);

	const rootRef = useRef<HTMLElement | null>(null);
	const optionRefs = useRef<Array<HTMLElement | null>>([]);
	const observer = useRef<ResizeObserver | undefined>(undefined);

	const attachRow = useCallback((element: HTMLElement | null) => {
		observer.current?.disconnect();
		observer.current = undefined;
		if (!element) return;

		const measure = () => {
			const origin = element.offsetLeft;
			setTrackWidth(element.offsetWidth);
			setBounds(
				optionRefs.current.map((option) => ({
					left: (option?.offsetLeft ?? 0) - origin,
					width: option?.offsetWidth ?? 0,
				})),
			);
		};
		measure();

		if (typeof ResizeObserver === "undefined") return;
		const watcher = new ResizeObserver(measure);
		watcher.observe(element);
		for (const option of optionRefs.current) {
			if (option) watcher.observe(option);
		}
		observer.current = watcher;
	}, []);

	const attachOption = useCallback(
		(index: number) => (element: HTMLElement | null) => {
			optionRefs.current[index] = element;
		},
		[],
	);

	useEffect(() => {
		optionRefs.current.length = optionCount;
		return () => observer.current?.disconnect();
	}, [optionCount]);

	const runs = runsOf(selected, bounds);
	const dividers = runs.flatMap((run) => {
		const lines: number[] = [];
		for (let index = run.start; index < run.end; index++) {
			const edge = bounds[index];
			if (edge) lines.push(edge.left + edge.width);
		}
		return lines;
	});

	const stretch = useMotionValue(1);
	const shadowOpacity = useMotionValue(0);
	const rest = useMotionValue(1);
	const held = useMotionValue(0);
	const drag = useMotionValue(Number.NaN);
	const dragWidth = useMotionValue(0);

	const isOpen = useRef(false);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	const setPressed = useCallback(
		(pressed: boolean) => {
			isOpen.current = pressed;
			const options = pressed ? OPEN : CLOSE;
			const targets: Array<[MotionValue<number>, number]> = [
				[stretch, pressed ? pressScale : 1],
				[shadowOpacity, pressed ? 1 : 0],
				[rest, pressed ? 0 : 1],
			];
			for (const [value, next] of targets) {
				if (reduceMotion) value.set(next);
				else animate(value, next, options);
			}
			held.set(pressed && !reduceMotion ? 1 : 0);
		},
		[held, pressScale, reduceMotion, rest, shadowOpacity, stretch],
	);

	const open = useCallback(() => {
		clearTimeout(closeTimer.current);
		if (!isOpen.current) setPressed(true);
	}, [setPressed]);

	const settle = useCallback(() => {
		clearTimeout(closeTimer.current);
		closeTimer.current = setTimeout(() => setPressed(false), SETTLE);
	}, [setPressed]);

	const flash = useCallback(() => {
		if (reduceMotion) return;
		open();
		settle();
	}, [open, reduceMotion, settle]);

	useEffect(() => () => clearTimeout(closeTimer.current), []);

	const pointer = useRef<number | null>(null);
	const startX = useRef(0);
	const startCentre = useRef(Number.NaN);
	const dragging = useRef(false);
	const latest = useRef({ bounds, runs, onDragSelect });
	latest.current = { bounds, runs, onDragSelect };

	const localX = (clientX: number) => {
		const root = rootRef.current;
		if (!root) return clientX;
		const box = root.getBoundingClientRect();
		const scale = root.offsetWidth > 0 ? box.width / root.offsetWidth : 1;
		return (clientX - box.left) / scale;
	};

	const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
		if (disabled || reduceMotion || pointer.current !== null) return;
		if (event.pointerType === "mouse" && event.button !== 0) return;
		pointer.current = event.pointerId;
		startX.current = event.clientX;
		dragging.current = false;
		startCentre.current = Number.NaN;
		const { runs: chosen, onDragSelect: pick } = latest.current;
		const only = chosen.length === 1 && chosen[0].start === chosen[0].end;
		if (pick && only) {
			const at = localX(event.clientX);
			const run = chosen[0];
			if (at >= run.left && at <= run.left + run.width) {
				startCentre.current = run.left + run.width / 2;
			}
		}
		open();
	};

	const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
		if (event.pointerId !== pointer.current) return;
		if (Number.isNaN(startCentre.current)) return;
		const root = rootRef.current;
		const scale =
			root && root.offsetWidth > 0
				? root.getBoundingClientRect().width / root.offsetWidth
				: 1;
		const moved = (event.clientX - startX.current) / scale;
		if (!dragging.current) {
			if (Math.abs(moved) < DRAG_SLOP) return;
			dragging.current = true;
			event.currentTarget.setPointerCapture(event.pointerId);
		}
		const options = latest.current.bounds;
		const first = options[0];
		const last = options.at(-1);
		if (!first || !last) return;
		const low = centreOf(first);
		const high = centreOf(last);
		const limit = indicatorHeight * OVERDRAG;
		let centre = startCentre.current + moved;
		if (centre < low) centre = low - rubberBand(low - centre, limit);
		else if (centre > high) centre = high + rubberBand(centre - high, limit);
		const capsule = capsuleAt(options, centre);
		dragWidth.set(capsule.width);
		drag.set(capsule.centre);
	};

	const endPointer = (event: ReactPointerEvent<HTMLElement>) => {
		if (event.pointerId !== pointer.current) return;
		pointer.current = null;
		if (dragging.current) {
			dragging.current = false;
			const index = nearestTo(latest.current.bounds, drag.get());
			latest.current.onDragSelect?.(index);
			drag.set(Number.NaN);
		}
		settle();
	};

	useEffect(() => {
		const apply = (value: number) =>
			rootRef.current?.style.setProperty("--segment-rest", String(value));
		apply(rest.get());
		return rest.on("change", apply);
	}, [rest]);

	const press = useMemo<SegmentPress>(
		() => ({ stretch, shadowOpacity, rest, held, drag, dragWidth }),
		[drag, dragWidth, held, rest, shadowOpacity, stretch],
	);

	return {
		geometry: {
			height,
			inset,
			indicatorHeight,
			margin,
			trackWidth,
			containerWidth: trackWidth + margin * 2,
			containerHeight: height + margin * 2,
		},
		runs,
		dividers,
		bounds,
		attachRow,
		attachOption,
		rootRef,
		rootProps: {
			onPointerDown,
			onPointerMove,
			onPointerUp: endPointer,
			onPointerCancel: endPointer,
		},
		press,
		flash,
		setPressed,
	};
}

export function useSegmentLens({
	run,
	indicatorHeight,
	margin,
	press,
	liquid = DEFAULT_LIQUID,
}: {
	run: SegmentRun;
	indicatorHeight: number;
	margin: number;
	press: SegmentPress;
	liquid?: number;
}) {
	const reduceMotion = useReducedMotion() ?? false;
	const centre = run.left + run.width / 2;

	const x = useMotionValue(centre);
	const span = useMotionValue(run.width);
	const { squish, kick } = useSquish(x, !reduceMotion, liquid, SPEED_STRETCH);

	const lensWidth = useDerived(
		[span, press.stretch, squish],
		([width, factor, amount]) =>
			squashed(width + indicatorHeight * (factor - 1), amount, true),
	);
	const lensHeight = useDerived([press.stretch, squish], ([factor, amount]) =>
		squashed(indicatorHeight * factor, amount, false),
	);
	const lensRadius = useDerived(
		[lensWidth, lensHeight],
		([across, tall]) => Math.min(across, tall) / 2,
	);
	const lensX = useTransform(x, (at) => margin + at);
	const edgeBias = useTransform(press.rest, (at) => at * 0.5);

	const settled = useRef(false);
	const moves = useRef<AnimationPlaybackControls[]>([]);
	const target = useRef({ centre, width: run.width });
	target.current = { centre, width: run.width };

	const glide = useCallback(
		(to: { centre: number; width: number }) => {
			for (const move of moves.current) move.stop();
			moves.current = [
				animate(x, to.centre, TRAVEL),
				animate(span, to.width, TRAVEL),
			];
		},
		[span, x],
	);

	useEffect(() => {
		if (!Number.isNaN(press.drag.get())) return;
		if (reduceMotion || !settled.current) {
			for (const move of moves.current) move.stop();
			x.set(centre);
			span.set(run.width);
			settled.current = true;
			return;
		}
		glide({ centre, width: run.width });
	}, [centre, glide, press.drag, reduceMotion, run.width, span, x]);

	useEffect(
		() => () => {
			for (const move of moves.current) move.stop();
		},
		[],
	);

	useEffect(() => {
		const follow = (at: number) => {
			if (Number.isNaN(at)) {
				glide(target.current);
				return;
			}
			for (const move of moves.current) move.stop();
			moves.current = [];
			span.set(press.dragWidth.get());
			x.set(at);
		};
		return press.drag.on("change", follow);
	}, [glide, press.drag, press.dragWidth, span, x]);

	useEffect(() => {
		let wasHeld = press.held.get() > 0.5;
		return press.held.on("change", (value) => {
			const holding = value > 0.5;
			if (holding !== wasHeld) kick(holding ? 1 : -1);
			wasHeld = holding;
		});
	}, [kick, press.held]);

	return {
		x: lensX,
		lensWidth,
		lensHeight,
		lensRadius,
		shadowOpacity: press.shadowOpacity,
		tintOpacity: press.rest,
		edgeBias,
	};
}
