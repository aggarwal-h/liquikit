"use client";

import {
	type AnimationPlaybackControls,
	animate,
	motion,
	useMotionValue,
	useReducedMotion,
	useTransform,
} from "motion/react";
import {
	createContext,
	type ReactNode,
	type Ref,
	type RefObject,
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	GlassPane,
	type GlassPaneProps,
	type GlassPaneReach,
	type GlassRefraction,
	type GlassTheme,
	hideGlass,
	landGlass,
	useDerived,
} from "./glass";

export const PopupState = createContext<{
	open: boolean;
	trigger: RefObject<HTMLElement | null>;
	point?: RefObject<{ x: number; y: number } | null>;
} | null>(null);

export type GlassHandoff = {
	panel: { current: { rect: DOMRect; radius: number; at: number } | null };
	open: { current: number };
};
export const Handoff = createContext<GlassHandoff | null>(null);

export function usePopupState() {
	const state = useContext(PopupState);
	if (!state) throw new Error("A glass popup must be inside its Root.");
	return state;
}

const LIFT = { type: "spring", visualDuration: 0.16, bounce: 0.2 } as const;
const TRAVEL = { type: "spring", visualDuration: 0.3, bounce: 0.22 } as const;
const LEAD = {
	type: "spring",
	visualDuration: 0.36,
	bounce: 0.3,
	delay: 0.035,
} as const;
const TRAIL = {
	type: "spring",
	visualDuration: 0.4,
	bounce: 0.34,
	delay: 0.065,
} as const;
const HANDOVER = {
	type: "spring",
	visualDuration: 0.38,
	bounce: 0.14,
} as const;
const HANDOVER_MS = 250;
const BACK = { type: "spring", visualDuration: 0.26, bounce: 0.12 } as const;
const HOMEWARD = {
	type: "spring",
	visualDuration: 0.28,
	bounce: 0.15,
	delay: 0.03,
} as const;
const SETTLE = {
	type: "spring",
	visualDuration: 0.2,
	bounce: 0.2,
	delay: 0.09,
} as const;
const HOME = 0.05;
const FADE_START = 0.55;
const FADE_END = 0.12;
const HOLD_MS = 1000;
const DROP = 1.35;
const SEED = 0.3;
const SWELL = { type: "spring", visualDuration: 0.36, bounce: 0.3 } as const;
const SWELL_LAG = 0.016;
const POINT_SEED = 14;
const ISLAND = { width: 120, height: 34 };
const CONTENT_BLUR = 10;
const CONTENT_SCALE = 0.9;
const GLOW = 0.6;
const FLIGHT_FROST = 0.3;

const NO_REACH: GlassPaneReach = { top: 0, right: 0, bottom: 0, left: 0 };

type Box = {
	x: number;
	y: number;
	width: number;
	height: number;
	radius: number;
};
const EMPTY: Box = { x: 0, y: 0, width: 0, height: 0, radius: 0 };

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (from: number, to: number, value: number) => {
	const t = clamp01((value - from) / (to - from));
	return t * t * (3 - 2 * t);
};

function absorb(trigger: HTMLElement | null, absorbed: boolean) {
	if (!trigger) return;
	if (absorbed) trigger.setAttribute("data-absorbed", "");
	else trigger.removeAttribute("data-absorbed");
	hideGlass(trigger, absorbed);
}

export type MorphOrigin = "trigger" | "centre" | "top" | "point";

export type MorphPaneProps = Omit<GlassPaneProps, "shape" | "reach"> & {
	panelRadius?: number;
	origin?: MorphOrigin;
	theme?: GlassTheme;
	refraction?: GlassRefraction;
	ref?: Ref<HTMLDivElement>;
	children?: ReactNode;
};

export function MorphPane({
	panelRadius = 22,
	origin = "trigger",
	theme,
	refraction,
	ref,
	children,
	...paneProps
}: MorphPaneProps) {
	const { open, trigger, point } = usePopupState();
	const handoff = useContext(Handoff);
	const reduceMotion = useReducedMotion() ?? false;
	const paneRef = useRef<HTMLDivElement | null>(null);
	const contentRef = useRef<HTMLDivElement | null>(null);
	const from = useRef<Box>(EMPTY);
	const to = useRef<Box>(EMPTY);
	const drop = useRef({ width: 0, height: 0 });
	const seeded = useRef(false);
	const handedOver = useRef(false);
	const running = useRef<AnimationPlaybackControls[]>([]);
	const covers = useRef(false);
	const absorbed = useRef(false);
	const hold = useRef<Animation | null>(null);
	const home = useRef<() => void>(() => {});
	const [reach, setReach] = useState<GlassPaneReach>(NO_REACH);

	const lift = useMotionValue(0);
	const travel = useMotionValue(0);
	const wide = useMotionValue(0);
	const tall = useMotionValue(0);
	const resized = useMotionValue(0);

	const x = useDerived([travel, resized], ([t]) =>
		lerp(from.current.x, to.current.x, t),
	);
	const y = useDerived([travel, resized], ([t]) =>
		lerp(from.current.y, to.current.y, t),
	);
	const width = useDerived([lift, wide, resized], ([l, g]) =>
		Math.max(
			0,
			lerp(
				lerp(from.current.width, drop.current.width, l),
				to.current.width,
				g,
			),
		),
	);
	const height = useDerived([lift, tall, resized], ([l, g]) =>
		Math.max(
			0,
			lerp(
				lerp(from.current.height, drop.current.height, l),
				to.current.height,
				g,
			),
		),
	);
	const landed = useDerived([wide, tall], ([a, b]) => Math.min(a, b));
	const radius = useDerived([width, height, landed], ([w, h, g]) => {
		const round = Math.min(w, h) / 2;
		if (handedOver.current) {
			return Math.min(round, lerp(from.current.radius, to.current.radius, g));
		}
		return Math.min(
			round,
			lerp(round, to.current.radius, smoothstep(0.35, 0.95, g)),
		);
	});
	const shape = useMemo(
		() => ({ x, y, width, height, radius }),
		[height, radius, width, x, y],
	);
	const glow = useDerived([lift, landed], ([l, g]) =>
		seeded.current || handedOver.current
			? 0
			: GLOW * l * (1 - smoothstep(0.3, 1, g)),
	);

	const frost = useDerived([landed], ([g]) =>
		handedOver.current ? 1 : lerp(FLIGHT_FROST, 1, smoothstep(0.2, 0.9, g)),
	);

	const focus = useTransform(landed, (g) =>
		handedOver.current ? clamp01(g / 0.6) : clamp01((g - 0.4) / 0.5),
	);
	const contentOpacity = useTransform(landed, (g) =>
		handedOver.current ? clamp01(g / 0.3) : clamp01((g - 0.4) / 0.25),
	);
	const contentFilter = useTransform(focus, (f) =>
		f > 0.97 ? "none" : `blur(${((1 - f) * CONTENT_BLUR).toFixed(2)}px)`,
	);
	const contentScale = useTransform(focus, (f) => lerp(CONTENT_SCALE, 1, f));

	useLayoutEffect(() => {
		if (!handoff || !open) return;
		handoff.open.current += 1;
		return () => {
			handoff.open.current -= 1;
		};
	}, [handoff, open]);

	const measureTrigger = useCallback(
		(pane: HTMLElement) => {
			const source = trigger.current?.getBoundingClientRect();
			if (!source) return false;
			const box = pane.getBoundingClientRect();
			const scale = pane.offsetWidth > 0 ? box.width / pane.offsetWidth : 1;
			const left = (source.left - box.left) / scale;
			const top = (source.top - box.top) / scale;
			const w = source.width / scale;
			const h = source.height / scale;
			const panel = to.current;
			from.current = {
				x: left + w / 2,
				y: top + h / 2,
				width: w,
				height: h,
				radius: h / 2,
			};
			const size = Math.min(h * DROP, panel.width, panel.height);
			drop.current = { width: size, height: size };
			covers.current = true;
			const spare = 8;
			const reachX = Math.max(w, size) / 2;
			const reachY = Math.max(h, size) / 2;
			setReach({
				left: Math.max(0, reachX - from.current.x) + spare,
				top: Math.max(0, reachY - from.current.y) + spare,
				right: Math.max(0, from.current.x + reachX - panel.width) + spare,
				bottom: Math.max(0, from.current.y + reachY - panel.height) + spare,
			});
			return true;
		},
		[trigger],
	);

	useLayoutEffect(() => {
		if (!open) return;
		hold.current?.cancel();
		hold.current = null;
		home.current();
		if (paneRef.current) {
			paneRef.current.style.minWidth = "";
			paneRef.current.style.minHeight = "";
			paneRef.current.style.opacity = "";
		}
		let frame = requestAnimationFrame(() => {
			frame = 0;
			const pane = paneRef.current;
			if (!pane) return;
			const box = pane.getBoundingClientRect();
			const scale = pane.offsetWidth > 0 ? box.width / pane.offsetWidth : 1;
			const panel = {
				x: pane.offsetWidth / 2,
				y: pane.offsetHeight / 2,
				width: pane.offsetWidth,
				height: pane.offsetHeight,
				radius: panelRadius,
			};
			to.current = panel;
			const source =
				origin === "trigger" ? trigger.current?.getBoundingClientRect() : null;
			const at = origin === "point" ? point?.current : null;
			const pointer = at
				? {
						x: Math.min(Math.max((at.x - box.left) / scale, 0), panel.width),
						y: Math.min(Math.max((at.y - box.top) / scale, 0), panel.height),
					}
				: null;
			if (reduceMotion) {
				from.current = panel;
				drop.current = { width: panel.width, height: panel.height };
				covers.current = false;
				seeded.current = false;
				for (const value of [lift, travel, wide, tall]) value.set(1);
				return;
			}
			const prior = handoff?.panel.current;
			if (handoff && prior && performance.now() - prior.at < HANDOVER_MS) {
				handoff.panel.current = null;
				const w = prior.rect.width / scale;
				const h = prior.rect.height / scale;
				from.current = {
					x: (prior.rect.left - box.left) / scale + w / 2,
					y: (prior.rect.top - box.top) / scale + h / 2,
					width: w,
					height: h,
					radius: prior.radius,
				};
				drop.current = { width: w, height: h };
				handedOver.current = true;
				seeded.current = false;
				covers.current = false;
				const spare = 8;
				setReach({
					left: Math.max(0, w / 2 - from.current.x) + spare,
					top: Math.max(0, h / 2 - from.current.y) + spare,
					right: Math.max(0, from.current.x + w / 2 - panel.width) + spare,
					bottom: Math.max(0, from.current.y + h / 2 - panel.height) + spare,
				});
				const content = contentRef.current;
				if (content) {
					content.style.transformOrigin = `${from.current.x}px ${from.current.y}px`;
				}
				lift.set(1);
				for (const value of [travel, wide, tall]) {
					animate(value, 1, HANDOVER);
				}
				return;
			}
			handedOver.current = false;
			if (!source) {
				const seed =
					origin === "top"
						? {
								x: panel.x,
								y: ISLAND.height / 2,
								width: Math.min(ISLAND.width, panel.width * 0.6),
								height: Math.min(ISLAND.height, panel.height),
							}
						: pointer
							? { ...pointer, width: POINT_SEED, height: POINT_SEED }
							: {
									x: panel.x,
									y: panel.y,
									width: panel.width * SEED,
									height: panel.height * SEED,
								};
				from.current = { ...seed, radius: seed.height / 2 };
				drop.current = { width: seed.width, height: seed.height };
				seeded.current = true;
				covers.current = false;
				setReach(NO_REACH);
				const content = contentRef.current;
				if (content) {
					content.style.transformOrigin = `${seed.x}px ${seed.y}px`;
				}
				lift.set(1);
				animate(travel, 1, pointer ? SWELL : TRAVEL);
				const wideFirst = origin === "top" || panel.width >= panel.height;
				animate(wideFirst ? wide : tall, 1, SWELL);
				animate(wideFirst ? tall : wide, 1, {
					...SWELL,
					delay: SWELL_LAG,
				});
				return;
			}
			seeded.current = false;
			measureTrigger(pane);
			const content = contentRef.current;
			if (content) {
				content.style.transformOrigin = `${from.current.x}px ${from.current.y}px`;
			}
			const alongY =
				Math.abs(panel.y - from.current.y) >=
				Math.abs(panel.x - from.current.x);
			animate(lift, 1, LIFT);
			animate(travel, 1, TRAVEL);
			animate(tall, 1, alongY ? LEAD : TRAIL);
			animate(wide, 1, alongY ? TRAIL : LEAD);
		});
		return () => {
			if (frame) cancelAnimationFrame(frame);
		};
	}, [
		handoff,
		lift,
		open,
		origin,
		panelRadius,
		point,
		reduceMotion,
		tall,
		travel,
		trigger,
		wide,
		measureTrigger,
	]);

	useEffect(() => {
		const pane = paneRef.current;
		if (!open || !pane || typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver(() => {
			const width = pane.offsetWidth;
			const height = pane.offsetHeight;
			const panel = to.current;
			if (panel === EMPTY) return;
			if (width === panel.width && height === panel.height) return;
			to.current = {
				...panel,
				x: width / 2,
				y: height / 2,
				width,
				height,
			};
			resized.set(resized.get() + 1);
		});
		observer.observe(pane);
		return () => observer.disconnect();
	}, [open, resized]);

	useLayoutEffect(() => {
		if (open) return;
		const pane = paneRef.current;
		if (!pane || reduceMotion || lift.get() === 0) return;
		const holding = pane.animate(
			[{ visibility: "visible" }, { visibility: "visible" }],
			{ duration: HOLD_MS },
		);
		hold.current = holding;

		if (handoff) {
			const pane = paneRef.current;
			const box = pane?.getBoundingClientRect();
			const scale =
				pane && pane.offsetWidth > 0 && box ? box.width / pane.offsetWidth : 1;
			const w = width.get();
			const h = height.get();
			const rect =
				box &&
				new DOMRect(
					box.left + (x.get() - w / 2) * scale,
					box.top + (y.get() - h / 2) * scale,
					w * scale,
					h * scale,
				);
			const handOver = () => {
				if (!rect || handoff.open.current === 0) return false;
				handoff.panel.current = {
					rect,
					radius: radius.get(),
					at: performance.now(),
				};
				home.current();
				for (const move of running.current) move.stop();
				if (hold.current === holding) holding.finish();
				return true;
			};
			if (!handOver()) {
				requestAnimationFrame(() => {
					if (hold.current === holding) handOver();
				});
			}
		}

		if (handedOver.current && !seeded.current) {
			handedOver.current = false;
			measureTrigger(pane);
		} else if (!seeded.current && origin === "trigger") {
			if (to.current !== EMPTY) {
				to.current = {
					...to.current,
					x: pane.offsetWidth / 2,
					y: pane.offsetHeight / 2,
					width: pane.offsetWidth,
					height: pane.offsetHeight,
				};
			}
			pane.style.minWidth = `${pane.offsetWidth}px`;
			pane.style.minHeight = `${pane.offsetHeight}px`;
			measureTrigger(pane);
		}
		if (seeded.current) {
			drop.current = { width: 0, height: 0 };
			const stop = landed.on("change", (value) => {
				if (value > HOME) return;
				stop();
				if (hold.current === holding) holding.finish();
			});
			home.current = stop;
			running.current = [
				animate(wide, 0, BACK),
				animate(tall, 0, BACK),
				animate(travel, 0, HOMEWARD),
			];
			return;
		}
		const fade = absorbed.current
			? () => {}
			: travel.on("change", (value) => {
					pane.style.opacity = String(
						clamp01((value - FADE_END) / (FADE_START - FADE_END)),
					);
				});
		const follow =
			origin === "trigger"
				? travel.on("change", () => {
						const source = trigger.current?.getBoundingClientRect();
						if (!source) return;
						const box = pane.getBoundingClientRect();
						const scale =
							pane.offsetWidth > 0 ? box.width / pane.offsetWidth : 1;
						from.current = {
							...from.current,
							x: (source.left - box.left) / scale + from.current.width / 2,
							y: (source.top - box.top) / scale + from.current.height / 2,
						};
					})
				: () => {};
		const stop = lift.on("change", (value) => {
			if (value > HOME) return;
			stop();
			follow();
			fade();
			const dx = from.current.x - to.current.x;
			const dy = from.current.y - to.current.y;
			const length = Math.hypot(dx, dy);
			landGlass(
				trigger.current,
				length > 0 ? { x: dx / length, y: dy / length } : undefined,
			);
			if (hold.current === holding) holding.finish();
		});
		home.current = () => {
			stop();
			follow();
			fade();
		};
		running.current = [
			animate(wide, 0, BACK),
			animate(tall, 0, BACK),
			animate(travel, 0, HOMEWARD),
			animate(lift, 0, SETTLE),
		];
	}, [
		handoff,
		height,
		landed,
		lift,
		open,
		origin,
		radius,
		reduceMotion,
		tall,
		travel,
		trigger,
		wide,
		width,
		x,
		y,
		measureTrigger,
	]);

	useEffect(() => {
		const button = trigger.current;
		const coveredBy = (pane: HTMLElement | null) => {
			const source = button?.getBoundingClientRect();
			const box = pane?.getBoundingClientRect();
			if (!source || !box) return false;
			return (
				source.left >= box.left - 1 &&
				source.top >= box.top - 1 &&
				source.right <= box.right + 1 &&
				source.bottom <= box.bottom + 1
			);
		};
		const stop = lift.on("change", (value) => {
			const next =
				covers.current &&
				value > HOME &&
				(absorbed.current || coveredBy(paneRef.current));
			if (next === absorbed.current) return;
			absorbed.current = next;
			absorb(button, next);
		});
		return () => {
			stop();
			absorbed.current = false;
			absorb(button, false);
		};
	}, [lift, trigger]);

	return (
		<GlassPane
			{...paneProps}
			ref={(element) => {
				paneRef.current = element;
				if (typeof ref === "function") ref(element);
				else if (ref) ref.current = element;
			}}
			radius={panelRadius}
			theme={theme}
			refraction={refraction}
			shape={shape}
			reach={reach}
			press={glow}
			frost={frost}
		>
			<motion.div
				ref={contentRef}
				style={{
					opacity: contentOpacity,
					filter: contentFilter,
					scale: contentScale,
				}}
			>
				{children}
			</motion.div>
		</GlassPane>
	);
}
