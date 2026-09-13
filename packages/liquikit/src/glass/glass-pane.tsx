"use client";

import {
	animate,
	type MotionValue,
	useMotionValue,
	useReducedMotion,
} from "motion/react";
import {
	type CSSProperties,
	type HTMLAttributes,
	type ReactNode,
	type Ref,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { supportsBackdropRefraction } from "./backdrop";
import { Glass } from "./glass";
import "./glass-pane.css";
import { DEFAULT_LIQUID, useDerived } from "./motion";
import type { LensProfile, LensShape } from "./optics";
import { type GlassTheme, paneLens, useLens } from "./presets";
import {
	LensPoolProvider,
	useGlassBackdrop,
	useGlassScope,
	useLensPool,
} from "./scope";
import { afterScroll, useInView } from "./settle";
import { useGlassTheme } from "./theme";
import { squashed, useSquish } from "./use-squish";

export type GlassPaneVariant = "regular" | "clear";

export type GlassRefraction = "interactive" | "always";

const MATERIAL: Record<
	GlassPaneVariant,
	{ tint: number; blur: number; saturate: number }
> = {
	regular: { tint: 0.5, blur: 14, saturate: 1.8 },
	clear: { tint: 0.12, blur: 0, saturate: 1 },
};

const PRESS_GROW = 0.1;
const EDGE_BIAS = 0.5;
const LIVE_FROM = 0.3;
const LIVE_SETTLE_MS = 900;
const WARM_PRESS = [0.35, 1] as const;
const VIEW_MARGIN = "120px";
const NESTED_MARGIN = 48;
const NESTED_FEATHER = 8;
const PRESS_LIGHT = 0.18;
const BARE_TINT = 0.35;
const LAND_EVENT = "glass-pane:land";
const HIDE_EVENT = "glass-pane:hide";
const LAND = { type: "spring", stiffness: 300, damping: 15 } as const;
const LAND_SPEED = 2.4;

export type GlassLanding = { x: number; y: number };

function paneOf(element: Element) {
	return element.classList.contains("glass-pane")
		? element
		: element.querySelector(".glass-pane");
}

export function hideGlass(
	element: Element | null | undefined,
	hidden: boolean,
) {
	if (!element) return;
	paneOf(element)?.dispatchEvent(
		new CustomEvent(HIDE_EVENT, { detail: hidden }),
	);
}

export function landGlass(
	element: Element | null | undefined,
	direction: GlassLanding = { x: 0, y: 1 },
) {
	if (!element) return;
	paneOf(element)?.dispatchEvent(
		new CustomEvent(LAND_EVENT, { detail: direction }),
	);
}

const ROOM = 24;

export type GlassPaneShape = {
	x: MotionValue<number>;
	y: MotionValue<number>;
	width: MotionValue<number>;
	height: MotionValue<number>;
	radius: MotionValue<number>;
};

export type GlassPaneReach = {
	top: number;
	right: number;
	bottom: number;
	left: number;
};

export type GlassPaneProps = HTMLAttributes<HTMLDivElement> & {
	radius?: number | "capsule";
	variant?: GlassPaneVariant;
	tint?: string;
	tintOpacity?: number;
	lens?: Partial<LensProfile>;
	theme?: GlassTheme;
	refraction?: GlassRefraction;
	press?: MotionValue<number>;
	liquid?: number;
	frost?: MotionValue<number>;
	shape?: GlassPaneShape;
	reach?: GlassPaneReach;
	ref?: Ref<HTMLDivElement>;
	children?: ReactNode;
};

const NO_REACH: GlassPaneReach = { top: 0, right: 0, bottom: 0, left: 0 };

export function GlassPane({
	radius = "capsule",
	variant = "regular",
	tint,
	tintOpacity,
	lens: lensOverrides,
	theme: themeProp,
	refraction = "interactive",
	press,
	liquid = DEFAULT_LIQUID,
	frost,
	shape,
	reach = NO_REACH,
	className,
	style,
	ref,
	children,
	...rest
}: GlassPaneProps) {
	const theme = useGlassTheme(themeProp);
	const lens = useLens(theme, lensOverrides, paneLens);
	const reduceMotion = useReducedMotion() ?? false;
	const material = MATERIAL[variant];
	const bodyOpacity = tintOpacity ?? material.tint;

	const rootRef = useRef<HTMLDivElement | null>(null);
	const contentRef = useRef<HTMLDivElement | null>(null);
	const [size, setSize] = useState({ width: 0, height: 0 });
	const [hidden, setHidden] = useState(false);
	const paneWidth = useMotionValue(0);
	const paneHeight = useMotionValue(0);

	useLayoutEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		const measure = () => {
			paneWidth.set(root.offsetWidth);
			paneHeight.set(root.offsetHeight);
			setSize((current) =>
				current.width === root.offsetWidth &&
				current.height === root.offsetHeight
					? current
					: { width: root.offsetWidth, height: root.offsetHeight },
			);
		};
		measure();
		if (typeof ResizeObserver === "undefined") return;
		let frame = 0;
		const observer = new ResizeObserver(() => {
			paneWidth.set(root.offsetWidth);
			paneHeight.set(root.offsetHeight);
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(measure);
		});
		observer.observe(root);
		return () => {
			observer.disconnect();
			cancelAnimationFrame(frame);
		};
	}, [paneHeight, paneWidth]);

	const { width, height } = size;
	const drawn = width > 0 && height > 0;
	const cornerFor = (tall: number) =>
		radius === "capsule" ? tall / 2 : Math.min(radius, tall / 2);

	const idle = useMotionValue(0);
	const pressed = press ?? idle;
	const still = useMotionValue(0);
	const { squish, kick } = useSquish(still, !reduceMotion, liquid);
	useEffect(() => {
		let down = pressed.get() > 0.5;
		return pressed.on("change", (value) => {
			const now = value > 0.5;
			if (now !== down) kick(now ? 1 : -1);
			down = now;
		});
	}, [kick, pressed]);

	const restable = refraction === "always";
	const [deferred, setDeferred] = useState(false);
	useLayoutEffect(() => setDeferred(!supportsBackdropRefraction()), []);

	// Safari and Firefox draw filters on the CPU and redraw them as they scroll
	// back into view, so resting glass there only starts bending on screen, once
	// the page has stopped scrolling.
	const inView = useInView(rootRef, VIEW_MARGIN, restable && deferred);
	const [resting, setResting] = useState(false);
	useEffect(() => {
		if (!restable || (deferred && !inView)) {
			setResting(false);
			return;
		}
		if (!deferred) {
			setResting(true);
			return;
		}
		return afterScroll(() => setResting(true));
	}, [deferred, inView, restable]);

	const [live, setLive] = useState(false);
	useEffect(() => {
		let timer: ReturnType<typeof setTimeout> | undefined;
		// Shapes are derived during render, so their changes can arrive mid-render.
		const wake = () => {
			clearTimeout(timer);
			timer = undefined;
			queueMicrotask(() => setLive(true));
		};
		const settle = () => {
			if (timer !== undefined) return;
			timer = setTimeout(() => {
				timer = undefined;
				setLive(false);
			}, LIVE_SETTLE_MS);
		};
		const follow = (value: number) => (value > LIVE_FROM ? wake() : settle());
		follow(pressed.get());
		const stops = [pressed.on("change", follow)];
		if (shape) {
			const moved = () => {
				wake();
				settle();
			};
			for (const value of [shape.x, shape.y, shape.width, shape.height]) {
				stops.push(value.on("change", moved));
			}
		}
		return () => {
			clearTimeout(timer);
			for (const stop of stops) stop();
		};
	}, [pressed, shape]);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		const hide = (event: Event) =>
			setHidden(Boolean((event as CustomEvent<boolean>).detail));
		root.addEventListener(HIDE_EVENT, hide);
		return () => root.removeEventListener(HIDE_EVENT, hide);
	}, []);

	const nudgeX = useMotionValue(0);
	const nudgeY = useMotionValue(0);
	useEffect(() => {
		const root = rootRef.current;
		if (!root || reduceMotion) return;
		const land = (event: Event) => {
			const way = (event as CustomEvent<GlassLanding>).detail ?? { x: 0, y: 1 };
			const speed = LAND_SPEED * paneHeight.get();
			animate(nudgeX, 0, { ...LAND, velocity: way.x * speed });
			animate(nudgeY, 0, { ...LAND, velocity: way.y * speed });
		};
		root.addEventListener(LAND_EVENT, land);
		return () => root.removeEventListener(LAND_EVENT, land);
	}, [nudgeX, nudgeY, paneHeight, reduceMotion]);
	useEffect(() => {
		const move = () => {
			const content = contentRef.current;
			if (!content) return;
			const x = nudgeX.get();
			const y = nudgeY.get();
			content.style.transform =
				x === 0 && y === 0 ? "" : `translate(${x}px, ${y}px)`;
		};
		const stops = [nudgeX.on("change", move), nudgeY.on("change", move)];
		return () => {
			for (const stop of stops) stop();
		};
	}, [nudgeX, nudgeY]);

	const boxX = useDerived([paneWidth], ([w]) => w / 2);
	const boxY = useDerived([paneHeight], ([h]) => h / 2);
	const centreX = shape?.x ?? boxX;
	const centreY = shape?.y ?? boxY;
	const baseWidth = shape?.width ?? paneWidth;
	const baseHeight = shape?.height ?? paneHeight;
	const baseRadius = useDerived(
		shape ? [shape.radius] : [paneHeight],
		([value]) => (shape ? value : cornerFor(value)),
	);

	const grow = useDerived([pressed, paneHeight], ([amount, tall]) =>
		shape ? 0 : tall * PRESS_GROW * amount,
	);
	const lensWidth = useDerived(
		[baseWidth, grow, squish],
		([value, extra, amount]) => squashed(value + extra * 2, amount, true),
	);
	const lensHeight = useDerived(
		[baseHeight, grow, squish],
		([value, extra, amount]) => squashed(value + extra * 2, amount, false),
	);
	const lensRadius = useDerived(
		[baseRadius, grow, lensWidth, lensHeight],
		([value, extra, across, tall]) =>
			radius === "capsule" && !shape
				? Math.min(across, tall) / 2
				: Math.min(value + extra, across / 2, tall / 2),
	);
	const originX = ROOM + reach.left;
	const originY = ROOM + reach.top;
	const lensX = useDerived([centreX, nudgeX], ([at, by]) => originX + at + by);
	const warm = useMemo<LensShape[] | undefined>(() => {
		if (shape || !drawn) return undefined;
		return WARM_PRESS.map((amount) => {
			const extra = height * PRESS_GROW * amount;
			const across = width + extra * 2;
			const tall = height + extra * 2;
			const corner =
				radius === "capsule"
					? Math.min(across, tall) / 2
					: Math.min(
							Math.min(radius, height / 2) + extra,
							across / 2,
							tall / 2,
						);
			const innerWidth = across - EDGE_BIAS * 2;
			const innerHeight = tall - EDGE_BIAS * 2;
			return {
				halfWidth: innerWidth / 2,
				halfHeight: innerHeight / 2,
				borderRadius: Math.max(
					0,
					Math.min(corner - EDGE_BIAS, innerWidth / 2, innerHeight / 2),
				),
			};
		});
	}, [drawn, height, radius, shape, width]);
	const lensY = useDerived([centreY, nudgeY], ([at, by]) => originY + at + by);
	const solid = useMotionValue(1);
	const frosted = frost ?? solid;
	const blur = useDerived([frosted], ([amount]) => material.blur * amount);
	const body = useDerived([pressed, frosted], ([amount, frostAmount]) =>
		Math.min(
			1,
			bodyOpacity * (BARE_TINT + (1 - BARE_TINT) * frostAmount) +
				PRESS_LIGHT * amount,
		),
	);

	// Glass on this pane bends a copy of the backdrop dressed as this pane:
	// blurred and tinted the same, drawn above the pane and below its content.
	const outer = useGlassScope();
	const backdropNode = useGlassBackdrop();
	const lensesRef = useRef<HTMLDivElement | null>(null);
	const [hosting, setHosting] = useState(false);
	useLayoutEffect(() => {
		const root = rootRef.current;
		setHosting(
			Boolean(
				outer &&
					backdropNode &&
					root?.closest("[data-glass-nested]") &&
					contentRef.current?.querySelector("[data-glass]"),
			),
		);
	}, [outer, backdropNode]);
	const nested = useLensPool({
		nested: true,
		enabled: hosting,
		element: () => lensesRef.current,
		backdrop: () => outer?.backdrop() ?? null,
		margin: NESTED_MARGIN,
		feather: NESTED_FEATHER,
		dress: ({ box, frost: layer }) => {
			const amount = material.blur * frosted.get();
			layer.style.filter =
				amount > 0 ? `blur(${amount}px) saturate(${material.saturate})` : "";
			const tintLayer = rootRef.current?.querySelector(
				":scope > .glass-pane__glass > .glass__tint",
			);
			if (!tintLayer) return;
			const style = getComputedStyle(tintLayer);
			box.style.setProperty("--lens-tint", style.backgroundColor);
			box.style.setProperty("--lens-tint-opacity", style.opacity);
		},
	});

	useEffect(() => {
		if (!shape) return;
		const content = contentRef.current;
		if (!content) return;
		const clip = () => {
			const w = lensWidth.get();
			const h = lensHeight.get();
			const left = centreX.get() - w / 2;
			const top = centreY.get() - h / 2;
			content.style.clipPath = `inset(${top}px ${width - left - w}px ${height - top - h}px ${left}px round ${lensRadius.get()}px)`;
		};
		clip();
		const stops = [centreX, centreY, lensWidth, lensHeight, lensRadius].map(
			(value) => value.on("change", clip),
		);
		return () => {
			for (const stop of stops) stop();
		};
	}, [
		centreX,
		centreY,
		height,
		lensHeight,
		lensRadius,
		lensWidth,
		shape,
		width,
	]);

	return (
		<div
			{...rest}
			ref={(element) => {
				rootRef.current = element;
				if (typeof ref === "function") ref(element);
				else if (ref) ref.current = element;
			}}
			className={["glass-pane", className].filter(Boolean).join(" ")}
			data-theme={theme}
			data-variant={variant}
			data-drawn={drawn ? "" : undefined}
			data-shaped={shape ? "" : undefined}
			style={
				{
					"--glass-pane-fill": tint ?? "var(--glass-pane-tint)",
					"--glass-pane-fill-opacity": String(bodyOpacity),
					"--glass-pane-frost": material.blur
						? `blur(${material.blur}px) saturate(${material.saturate})`
						: "none",
					"--glass-pane-shadow": lens.edgeShadow,
					...style,
					borderRadius: drawn
						? cornerFor(height)
						: radius === "capsule"
							? 9999
							: radius,
				} as CSSProperties
			}
		>
			{drawn ? (
				<Glass
					className="glass-pane__glass"
					width={width + ROOM * 2 + reach.left + reach.right}
					height={height + ROOM * 2 + reach.top + reach.bottom}
					style={{ left: -originX, top: -originY }}
					x={lensX}
					y={lensY}
					lensWidth={lensWidth}
					lensHeight={lensHeight}
					lensRadius={lensRadius}
					lens={lens}
					refract={resting || live}
					light
					warm={warm}
					tintColor={tint ?? "var(--glass-pane-tint)"}
					tintOpacity={body}
					tintBlur={blur}
					tintSaturate={material.saturate}
					shadowOpacity={1}
					edgeBias={EDGE_BIAS}
					hidden={hidden}
				/>
			) : null}
			{hosting ? (
				<div ref={lensesRef} className="glass-pane__lenses">
					{nested.render(backdropNode)}
				</div>
			) : null}
			<LensPoolProvider value={hosting ? nested.pool : outer}>
				<div ref={contentRef} className="glass-pane__content">
					{children}
				</div>
			</LensPoolProvider>
		</div>
	);
}
