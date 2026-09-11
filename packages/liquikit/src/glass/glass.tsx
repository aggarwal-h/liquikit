"use client";

import {
	cancelFrame,
	frame as frameLoop,
	type MotionValue,
	useMotionValue,
} from "motion/react";
import {
	type CSSProperties,
	type ReactNode,
	useCallback,
	useEffect,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { supportsBackdropRefraction, underBackdropRoot } from "./backdrop";
import { displacementIsSmooth } from "./engine";
import "./glass.css";
import { lightOverlay, readyOverlay } from "./light";
import {
	decodeMap,
	generateLensMap,
	isMapDecoded,
	type LensMap,
	type LensProfile,
	type LensShape,
	profileKey,
	snapShape,
} from "./optics";
import { type GlassLens, offsetWithin, useGlassScope } from "./scope";

export type Animatable = MotionValue<number> | number;

function read(value: Animatable) {
	return typeof value === "number" ? value : value.get();
}

function lensBox(
	x: Animatable,
	y: Animatable,
	lensWidth: Animatable,
	lensHeight: Animatable,
	lensRadius: Animatable,
	bias: Animatable,
) {
	const inset = read(bias);
	const innerWidth = Math.max(1, read(lensWidth) - inset * 2);
	const innerHeight = Math.max(1, read(lensHeight) - inset * 2);
	const radius = Math.max(
		0,
		Math.min(read(lensRadius) - inset, Math.min(innerWidth, innerHeight) / 2),
	);
	return {
		left: read(x) - innerWidth / 2,
		top: read(y) - innerHeight / 2,
		innerWidth,
		innerHeight,
		radius,
	};
}

function subscribe(value: Animatable, listener: () => void) {
	return typeof value === "number" ? undefined : value.on("change", listener);
}

type Mode = "backdrop" | "copy" | "lens" | "none";

type Place = {
	x: number;
	y: number;
	originX: number;
	originY: number;
	width: number;
	height: number;
};

type Held = { shape: LensShape; key: string; scale: number; result: LensMap };

const STRETCH_LIMIT = 0.12;
const SETTLE_MS = 90;
const PINCH_SETTLE_MS = 160;
const MAX_PINCH = 4;
const BODY_OPAQUE = 0.995;
const RELAX_FROM = 0.35;
const WARM_TIMEOUT_MS = 2000;

function withinStretch(shape: LensShape, drawn: LensShape) {
	const near = (value: number, reference: number) =>
		reference > 0
			? Math.abs(value / reference - 1) <= STRETCH_LIMIT
			: value === reference;
	return (
		near(shape.halfWidth, drawn.halfWidth) &&
		near(shape.halfHeight, drawn.halfHeight) &&
		near(shape.borderRadius, drawn.borderRadius)
	);
}

function mapImages(map: LensMap, sliced: boolean) {
	if (!sliced) return [map.url, map.light];
	return map.slices ? [...map.slices.map, ...map.slices.light] : [];
}

function mapReady(map: LensMap, sliced: boolean) {
	return mapImages(map, sliced).every(isMapDecoded);
}

function decodeLensMap(map: LensMap, sliced: boolean) {
	return Promise.all(mapImages(map, sliced).map(decodeMap));
}

function sameShape(a: LensShape, b: LensShape) {
	return (
		a.halfWidth === b.halfWidth &&
		a.halfHeight === b.halfHeight &&
		a.borderRadius === b.borderRadius
	);
}

function drawn(value: string | undefined) {
	return value && value !== "none" ? value : undefined;
}

function whenIdle(task: () => void) {
	if (typeof requestIdleCallback === "function") {
		const handle = requestIdleCallback(task, { timeout: WARM_TIMEOUT_MS });
		return () => cancelIdleCallback(handle);
	}
	const handle = setTimeout(task, WARM_TIMEOUT_MS / 4);
	return () => clearTimeout(handle);
}

const IDENTITY_KERNEL = "0 0 0 0 1 0 0 0 0";

function smoothingKernel(amount: number) {
	const s = clamp01(amount);
	if (s === 0) return IDENTITY_KERNEL;
	const corner = s / 16;
	const side = (2 * s) / 16;
	const centre = 1 - s + (4 * s) / 16;
	return [corner, side, corner, side, centre, side, corner, side, corner]
		.map((value) => value.toFixed(5))
		.join(" ");
}

function smoothstep(from: number, to: number, value: number) {
	const k = clamp01((value - from) / (to - from));
	return k * k * (3 - 2 * k);
}

function clamp01(value: number) {
	return value < 0 ? 0 : value > 1 ? 1 : value;
}

export type GlassProps = {
	width: number;
	height: number;
	x: Animatable;
	y: Animatable;
	lensWidth: Animatable;
	lensHeight: Animatable;
	lensRadius: Animatable;
	lens: LensProfile;
	refractionTarget?: ReactNode;
	refract?: boolean;
	light?: boolean;
	warm?: LensShape[];
	shadowOpacity?: Animatable;
	tintColor?: string;
	tintOpacity?: Animatable;
	face?: ReactNode;
	tintBlur?: Animatable;
	tintSaturate?: number;
	edgeBias?: Animatable;
	lag?: Animatable;
	resolution?: number;
	hidden?: boolean;
	relax?: boolean;
	className?: string;
	style?: CSSProperties;
	children?: ReactNode;
};

export function Glass({
	width,
	height,
	x,
	y,
	lensWidth,
	lensHeight,
	lensRadius,
	lens,
	refractionTarget,
	refract = true,
	light = false,
	warm,
	shadowOpacity,
	tintColor = "white",
	tintOpacity,
	face,
	tintBlur,
	tintSaturate = 1,
	edgeBias,
	lag,
	resolution = 2,
	hidden = false,
	relax = false,
	className,
	style,
	children,
}: GlassProps) {
	const softness = lens.softness;
	const openTint = clamp01(lens.openTint);
	const rawId = useId();
	const baseId = `glass-${rawId.replaceAll(":", "")}`;
	const scope = useGlassScope();

	const rootRef = useRef<HTMLDivElement>(null);
	const layerRef = useRef<HTMLDivElement>(null);
	const filterRef = useRef<SVGFilterElement>(null);
	const rimImageRef = useRef<Element>(null);
	const lightImageRef = useRef<Element>(null);
	const mapSliceRefs = useRef<Element[]>([]);
	const lightSliceRefs = useRef<Element[]>([]);
	const lagPassRef = useRef<Element>(null);
	const frostPassRef = useRef<Element>(null);
	const saturatePassRef = useRef<Element>(null);
	const softenRefs = useRef<Element[]>([]);
	const tintRef = useRef<HTMLDivElement>(null);
	const frostRef = useRef<HTMLDivElement>(null);
	const faceRef = useRef<HTMLDivElement>(null);
	const lightRef = useRef<HTMLDivElement>(null);
	const shadowRef = useRef<HTMLDivElement>(null);
	const restShadowRef = useRef<HTMLDivElement>(null);
	const lensRegionRefs = useRef<Element[]>([]);
	const reachRegionRefs = useRef<Element[]>([]);
	const rimRegionRefs = useRef<Element[]>([]);
	const rimPassRefs = useRef<Element[]>([]);
	const version = useRef(0);
	const dished = Math.abs(1 - 1 / Math.max(lens.magnification, 0.01)) > 1e-4;
	const sliced = !dished;
	const lastMap = useRef<number | undefined>(undefined);
	const lastSignature = useRef("");
	const heldMap = useRef<Held | undefined>(undefined);
	const warmed = useRef<Held[]>([]);
	const readyMap = useRef<LensMap | undefined>(undefined);
	const leased = useRef<GlassLens | null>(null);
	const offset = useRef<Place | null>(null);
	const shownLight = useRef<string | undefined>(undefined);
	const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);
	const screenScale = useRef(1);
	const forceNext = useRef(false);
	const frame = useRef(0);
	const pending = useRef<(() => void) | null>(null);
	const alive = useRef(true);
	const hiddenRef = useRef(hidden);
	hiddenRef.current = hidden;
	const refractRef = useRef(refract);
	refractRef.current = refract;
	const scheduleRef = useRef<() => void>(() => {});

	const targeted = refractionTarget !== undefined;
	const [mode, setMode] = useState<Mode>(targeted ? "copy" : "none");
	const frostInFilter = mode === "backdrop" && tintBlur !== undefined;
	useLayoutEffect(() => {
		const chromium = supportsBackdropRefraction();
		const root = rootRef.current;
		// Chromium drops an SVG backdrop filter with other glass behind it, and
		// glass bent under other glass is lost under its frost anyway.
		const outside = targeted
			? root
			: root?.closest(".glass-pane")?.parentElement;
		const nested = Boolean(outside?.closest(".glass-pane"));
		const scoped = Boolean(scope && root?.closest(".glass-scope"));
		setMode(
			nested
				? scope?.nested
					? "lens"
					: targeted
						? "copy"
						: "none"
				: targeted && chromium
					? "backdrop"
					: scoped
						? "lens"
						: chromium
							? "backdrop"
							: targeted
								? "copy"
								: "none",
		);
	}, [scope, targeted]);

	const zero = useMotionValue(0);
	const one = useMotionValue(1);
	const shadow = shadowOpacity ?? zero;
	const tint = tintOpacity ?? one;
	const blur = tintBlur ?? zero;
	const bias = edgeBias ?? zero;
	const trail = lag ?? zero;

	const mapFor = useCallback(
		(shape: LensShape) => {
			const key = profileKey(lens);
			const scale = screenScale.current;
			const snapped = snapShape(shape);
			const candidates = [heldMap.current, ...warmed.current].filter(
				(entry): entry is Held =>
					entry !== undefined && entry.key === key && entry.scale === scale,
			);
			const exact = candidates.find((entry) => sameShape(snapped, entry.shape));
			if (exact) {
				heldMap.current = exact;
				return exact.result;
			}
			const near = candidates.find((entry) =>
				withinStretch(snapped, entry.shape),
			);
			if (near) {
				heldMap.current = near;
				clearTimeout(settleTimer.current);
				settleTimer.current = setTimeout(() => {
					if (!alive.current) return;
					heldMap.current = undefined;
					scheduleRef.current();
				}, SETTLE_MS);
				return near.result;
			}
			const result = generateLensMap(shape, lens, scale);
			heldMap.current = result
				? { shape: snapped, key, scale, result }
				: undefined;
			return result;
		},
		[lens],
	);

	const measurePlace = useCallback(() => {
		const root = rootRef.current;
		const element = scope?.element();
		const backdrop = scope?.backdrop();
		if (!root || !element || !backdrop) {
			offset.current = null;
			return;
		}
		const at = offsetWithin(root, element);
		const origin = element === backdrop ? at : offsetWithin(element, backdrop);
		const size = offsetWithin(backdrop, backdrop);
		offset.current = {
			x: at.x,
			y: at.y,
			originX: element === backdrop ? 0 : origin.x,
			originY: element === backdrop ? 0 : origin.y,
			width: size.width,
			height: size.height,
		};
	}, [scope]);

	const release = useCallback(() => {
		const held = leased.current;
		if (!held) return;
		leased.current = null;
		scope?.release(held);
		lastSignature.current = "";
	}, [scope]);

	const sync = useCallback(() => {
		frame.current = 0;
		const filter = filterRef.current;
		const layer = layerRef.current;
		if (!filter) return;

		const { left, top, innerWidth, innerHeight, radius } = lensBox(
			x,
			y,
			lensWidth,
			lensHeight,
			lensRadius,
			bias,
		);

		const placeOnLens = (element: HTMLDivElement | null) => {
			if (!element) return;
			element.style.transform = `translate3d(${left}px, ${top}px, 0)`;
			element.style.width = `${innerWidth}px`;
			element.style.height = `${innerHeight}px`;
			element.style.borderRadius = `${radius}px`;
		};

		const shadowAmount = clamp01(read(shadow));
		const rim = shadowRef.current;
		placeOnLens(rim);
		if (rim) rim.style.opacity = String(shadowAmount);

		const restRim = restShadowRef.current;
		placeOnLens(restRim);
		if (restRim) restRim.style.opacity = String(1 - shadowAmount);

		const bodyOpacity = clamp01(read(tint));
		const body = tintRef.current;
		placeOnLens(body);
		if (body) {
			body.style.opacity = String(openTint + (1 - openTint) * bodyOpacity);
		}

		const refracting =
			refractRef.current &&
			!hiddenRef.current &&
			mode !== "none" &&
			bodyOpacity < BODY_OPAQUE;

		const frost = frostRef.current;
		if (frost && frostInFilter && refracting) {
			frost.style.display = "none";
		} else if (frost) {
			const amount = read(blur);
			placeOnLens(frost);
			const backdropBlur =
				amount > 0
					? `blur(${amount}px)${tintSaturate !== 1 ? ` saturate(${tintSaturate})` : ""}`
					: "none";
			frost.style.display = amount > 0 ? "" : "none";
			frost.style.backdropFilter = backdropBlur;
			frost.style.setProperty("-webkit-backdrop-filter", backdropBlur);
		}

		const faceLayer = faceRef.current;
		if (faceLayer) {
			faceLayer.style.opacity = String(bodyOpacity);
			faceLayer.style.clipPath = `inset(${top}px ${width - left - innerWidth}px ${height - top - innerHeight}px ${left}px round ${radius}px)`;
		}

		// A copy on a see-through layer gives the filter's light nothing to land
		// on, so it takes the baked light instead, as the lens opens.
		const lensLit = targeted && mode === "copy" && refracting;
		const lit = (light || lensLit) && !hiddenRef.current;
		const shape = {
			halfWidth: innerWidth / 2,
			halfHeight: innerHeight / 2,
			borderRadius: radius,
		};
		const drawnMap = lit || refracting ? mapFor(shape) : undefined;

		const lightLayer = lightRef.current;
		if (lightLayer) {
			lightLayer.style.display = lit ? "" : "none";
			if (lit) {
				placeOnLens(lightLayer);
				lightLayer.style.opacity = light ? "" : String(1 - bodyOpacity);
				const overlay = drawnMap ? readyOverlay(drawnMap.light) : undefined;
				if (drawnMap && !overlay) {
					lightOverlay(drawnMap.light).then(() => {
						if (alive.current) scheduleRef.current();
					});
				}
				const next = overlay ?? shownLight.current;
				if (next !== shownLight.current) {
					shownLight.current = next;
					lightLayer.style.backgroundImage = next ? `url("${next}")` : "";
				}
			}
		}

		if (layer) {
			const hide = !refracting;
			if (hide !== (layer.style.visibility === "hidden")) {
				layer.style.visibility = hide ? "hidden" : "";
				if (!hide) forceNext.current = true;
			}
		}

		if (!refracting) {
			if (mode === "backdrop" && layer && layer.style.backdropFilter) {
				layer.style.backdropFilter = "";
				lastSignature.current = "";
			}
			release();
			return;
		}

		// Checked as the glass opens, since a card or a fade can turn into a
		// backdrop root after the glass mounts.
		if (
			mode === "backdrop" &&
			layer &&
			!layer.style.backdropFilter &&
			underBackdropRoot(layer)
		) {
			const scoped = Boolean(scope && rootRef.current?.closest(".glass-scope"));
			setMode(targeted ? (scoped ? "lens" : "copy") : "none");
			return;
		}

		const factor = mode === "copy" ? resolution : 1;
		const scaled = (value: number) => value * factor;
		const grid = screenScale.current / factor;
		const snap = (value: number) => Math.round(value * grid) / grid;

		if (mode === "copy" && layer) {
			const regionWidth = scaled(width);
			const regionHeight = scaled(height);
			layer.style.clipPath = `inset(${scaled(top)}px ${regionWidth - scaled(left + innerWidth)}px ${regionHeight - scaled(top + innerHeight)}px ${scaled(left)}px round ${scaled(radius)}px)`;
		}

		let result = drawnMap;
		if (drawnMap && !mapReady(drawnMap, sliced)) {
			decodeLensMap(drawnMap, sliced).then(() => {
				if (!alive.current) return;
				forceNext.current = true;
				scheduleRef.current();
			});
			if (readyMap.current) result = readyMap.current;
		} else if (drawnMap) {
			readyMap.current = drawnMap;
		}
		const pieces = sliced ? result?.slices : undefined;
		if (sliced && !pieces) result = undefined;

		const settled = relax
			? 1 - smoothstep(RELAX_FROM, BODY_OPAQUE, bodyOpacity)
			: 1;
		const unit = result ? scaled(result.displacement) * settled : 0;
		const scales = result
			? ([
					unit * result.chroma[0],
					unit * result.chroma[1],
					unit * result.chroma[2],
				] as const)
			: ([0, 0, 0] as const);
		const soften =
			dished && !displacementIsSmooth()
				? smoothingKernel(softness)
				: IDENTITY_KERNEL;
		const shift = snap(scaled(read(trail)));
		const frostAmount = frostInFilter
			? Math.round(scaled(read(blur)) * 100) / 100
			: 0;

		const outward = (distance: number | undefined) =>
			distance
				? Math.ceil((scaled(distance * 1.15) + factor) * grid) / grid
				: 0;
		const rimReach = outward(result?.rimReach);
		const reach = Math.max(outward(result?.reach), rimReach);

		let originX = 0;
		let originY = 0;
		if (mode === "lens") {
			if (!leased.current) {
				leased.current = scope?.lease() ?? null;
				if (!leased.current) return;
				forceNext.current = true;
			}
			if (!offset.current) measurePlace();
			const at = offset.current;
			if (!at) return;
			const pull =
				Math.max(
					reach,
					Math.abs(shift),
					...scales.map((s) => Math.abs(s) / 2),
				) +
				2 +
				leased.current.feather;
			const bounds = {
				left: Math.floor(at.x + left - pull),
				top: Math.floor(at.y + top - pull),
				right: Math.ceil(at.x + left + innerWidth + pull),
				bottom: Math.ceil(at.y + top + innerHeight + pull),
			};
			originX = at.x - bounds.left;
			originY = at.y - bounds.top;
			const { box, frost, copy, margin } = leased.current;
			const boxWidth = bounds.right - bounds.left;
			const boxHeight = bounds.bottom - bounds.top;
			box.style.left = `${bounds.left}px`;
			box.style.top = `${bounds.top}px`;
			box.style.width = `${boxWidth}px`;
			box.style.height = `${boxHeight}px`;
			frost.style.left = `${-margin}px`;
			frost.style.top = `${-margin}px`;
			frost.style.width = `${boxWidth + margin * 2}px`;
			frost.style.height = `${boxHeight + margin * 2}px`;
			copy.style.left = `${margin - bounds.left - at.originX}px`;
			copy.style.top = `${margin - bounds.top - at.originY}px`;
			copy.style.width = `${at.width}px`;
			copy.style.height = `${at.height}px`;
		}

		const edge = factor / 2;
		const regionX = snap(originX + scaled(left) + edge);
		const regionY = snap(originY + scaled(top) + edge);
		const regionInnerWidth =
			snap(originX + scaled(left + innerWidth) - edge) - regionX;
		const regionInnerHeight =
			snap(originY + scaled(top + innerHeight) - edge) - regionY;

		const signature = `${regionX}|${regionY}|${regionInnerWidth}|${regionInnerHeight}|${reach}|${rimReach}|${scales.join(",")}|${soften}|${shift}|${frostAmount}|${result?.id ?? ""}`;
		if (!forceNext.current && signature === lastSignature.current) return;
		lastSignature.current = signature;
		forceNext.current = false;

		for (const element of lensRegionRefs.current) {
			element.setAttribute("x", String(regionX));
			element.setAttribute("y", String(regionY));
			element.setAttribute("width", String(regionInnerWidth));
			element.setAttribute("height", String(regionInnerHeight));
		}
		const grow = (elements: Element[], by: number) => {
			for (const element of elements) {
				element.setAttribute("x", String(regionX - by));
				element.setAttribute("y", String(regionY - by));
				element.setAttribute("width", String(regionInnerWidth + by * 2));
				element.setAttribute("height", String(regionInnerHeight + by * 2));
			}
		};
		grow(reachRegionRefs.current, reach);
		grow(rimRegionRefs.current, rimReach);
		if (pieces) {
			const { cut } = pieces;
			const alongX = cut?.axis !== "y";
			const from = alongX ? regionX : regionY;
			const size = alongX ? regionInnerWidth : regionInnerHeight;
			const length = alongX ? pieces.width : pieces.height;
			const pixel = 1 / grid;
			const spans = cut
				? [
						[from, from + (cut.start * size) / length],
						[
							Math.max(from, from + (cut.start * size) / length - pixel),
							Math.min(
								from + size,
								from + ((length - cut.end) * size) / length + pixel,
							),
						],
						[from + ((length - cut.end) * size) / length, from + size],
					]
				: [[from, from + size]];
			const place = (element: Element, index: number) => {
				const [lead, tail] = spans[index] ?? spans[0];
				const span = String(tail - lead);
				element.setAttribute("x", String(alongX ? lead : regionX));
				element.setAttribute("y", String(alongX ? regionY : lead));
				element.setAttribute("width", alongX ? span : String(regionInnerWidth));
				element.setAttribute(
					"height",
					alongX ? String(regionInnerHeight) : span,
				);
			};
			mapSliceRefs.current.forEach(place);
			lightSliceRefs.current.forEach(place);
		}
		if (result && result.id !== lastMap.current) {
			lastMap.current = result.id;
			if (pieces) {
				// An feImage without an image drops the whole filter in WebKit.
				const show = (elements: Element[], urls: string[]) => {
					elements.forEach((element, index) => {
						element.setAttribute("href", urls[index] ?? urls[0]);
					});
				};
				show(mapSliceRefs.current, pieces.map);
				show(lightSliceRefs.current, pieces.light);
			} else {
				rimImageRef.current?.setAttribute("href", result.url);
				lightImageRef.current?.setAttribute("href", result.light);
			}
		}
		lagPassRef.current?.setAttribute("dx", String(shift));
		frostPassRef.current?.setAttribute("stdDeviation", String(frostAmount));
		saturatePassRef.current?.setAttribute(
			"values",
			String(frostAmount > 0 ? tintSaturate : 1),
		);
		for (const element of softenRefs.current) {
			element.setAttribute("kernelMatrix", soften);
		}
		rimPassRefs.current.forEach((element, index) => {
			element.setAttribute("scale", String(scales[index] ?? 0));
		});

		// Safari caches filter output by id, so every update takes a fresh one.
		version.current += 1;
		const id = `${baseId}-v${version.current}`;
		filter.id = id;
		if (mode === "lens" && leased.current) {
			leased.current.box.style.filter = `url(#${id})`;
		} else if (mode === "backdrop" && layer) {
			layer.style.backdropFilter = `url(#${id})`;
		} else if (layer) {
			layer.style.filter = `url(#${id})`;
		}

		if (result && !mapReady(result, sliced)) {
			const shown = result.id;
			decodeLensMap(result, sliced).then(() => {
				if (!alive.current || lastMap.current !== shown) return;
				forceNext.current = true;
				scheduleRef.current();
			});
		}
	}, [
		baseId,
		bias,
		blur,
		dished,
		frostInFilter,
		height,
		light,
		openTint,
		softness,
		mapFor,
		measurePlace,
		mode,
		lensHeight,
		lensRadius,
		lensWidth,
		relax,
		release,
		resolution,
		scope,
		shadow,
		sliced,
		targeted,
		tint,
		tintSaturate,
		trail,
		width,
		x,
		y,
	]);

	const schedule = useCallback(() => {
		if (frame.current) return;
		frame.current = 1;
		pending.current = sync;
		frameLoop.render(sync);
	}, [sync]);
	scheduleRef.current = schedule;

	useLayoutEffect(() => {
		const filter = filterRef.current;
		lensRegionRefs.current = filter
			? Array.from(filter.querySelectorAll("[data-lens]"))
			: [];
		reachRegionRefs.current = filter
			? Array.from(filter.querySelectorAll("[data-reach]"))
			: [];
		rimRegionRefs.current = filter
			? Array.from(filter.querySelectorAll("[data-rim]"))
			: [];
		rimPassRefs.current = filter
			? Array.from(filter.querySelectorAll('[data-pass="rim"]'))
			: [];
		lagPassRef.current = filter?.querySelector('[data-pass="lag"]') ?? null;
		frostPassRef.current = filter?.querySelector('[data-pass="frost"]') ?? null;
		saturatePassRef.current =
			filter?.querySelector('[data-pass="saturate"]') ?? null;
		softenRefs.current = filter
			? Array.from(filter.querySelectorAll("[data-soften]"))
			: [];
		rimImageRef.current = filter?.querySelector('[data-map="rim"]') ?? null;
		lightImageRef.current = filter?.querySelector('[data-map="light"]') ?? null;
		mapSliceRefs.current = filter
			? Array.from(filter.querySelectorAll('[data-slice="map"]'))
			: [];
		lightSliceRefs.current = filter
			? Array.from(filter.querySelectorAll('[data-slice="light"]'))
			: [];
		lastMap.current = undefined;
		lastSignature.current = "";
		alive.current = true;

		const measure = () => {
			const node = rootRef.current;
			if (!node || width <= 0) return;
			if (scope) {
				measurePlace();
				forceNext.current = true;
			}
			const ratio =
				(node.getBoundingClientRect().width / width) *
				(window.devicePixelRatio || 1) *
				Math.min(window.visualViewport?.scale ?? 1, MAX_PINCH);
			if (!Number.isFinite(ratio) || ratio <= 0) return;
			if (Math.abs(ratio - screenScale.current) < 0.01 && !scope) return;
			screenScale.current = ratio;
			forceNext.current = true;
			sync();
		};
		measure();
		sync();

		let moved = 0;
		const scopeElement = scope?.backdrop();
		const layout =
			scopeElement && typeof ResizeObserver !== "undefined"
				? new ResizeObserver(() => {
						if (moved) return;
						moved = requestAnimationFrame(() => {
							moved = 0;
							measure();
						});
					})
				: undefined;
		if (layout && scopeElement) {
			let node = rootRef.current?.parentElement ?? null;
			while (node && node !== scopeElement) {
				layout.observe(node);
				node = node.parentElement;
			}
			layout.observe(scopeElement);
		}
		const stopScope = scope?.onChange(() => {
			forceNext.current = true;
			scheduleRef.current();
		});

		let pinched: ReturnType<typeof setTimeout> | undefined;
		const settle = () => {
			clearTimeout(pinched);
			pinched = setTimeout(measure, PINCH_SETTLE_MS);
		};
		window.addEventListener("resize", measure);
		window.visualViewport?.addEventListener("resize", settle);
		return () => {
			window.removeEventListener("resize", measure);
			window.visualViewport?.removeEventListener("resize", settle);
			clearTimeout(pinched);
			layout?.disconnect();
			stopScope?.();
			cancelAnimationFrame(moved);
			clearTimeout(settleTimer.current);
			release();
			alive.current = false;
		};
	}, [measurePlace, release, scope, sync, width]);

	useEffect(() => {
		const unsubscribes = [
			x,
			y,
			lensWidth,
			lensHeight,
			lensRadius,
			shadow,
			tint,
			blur,
			bias,
			trail,
		].map((value) => subscribe(value, schedule));
		return () => {
			if (pending.current) cancelFrame(pending.current);
			pending.current = null;
			frame.current = 0;
			for (const unsubscribe of unsubscribes) unsubscribe?.();
		};
	}, [
		bias,
		blur,
		lensHeight,
		lensRadius,
		lensWidth,
		schedule,
		shadow,
		tint,
		trail,
		x,
		y,
	]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: a flip of either only needs a fresh sync
	useEffect(() => {
		forceNext.current = true;
		scheduleRef.current();
	}, [hidden, refract]);

	const warmKey = warm
		?.map((shape) => {
			const snapped = snapShape(shape);
			return `${snapped.halfWidth}x${snapped.halfHeight}r${snapped.borderRadius}`;
		})
		.join("|");
	// biome-ignore lint/correctness/useExhaustiveDependencies: warmKey stands in for the shapes
	useEffect(() => {
		if (!warm?.length || mode === "none") return;
		return whenIdle(() => {
			const key = profileKey(lens);
			const scale = screenScale.current;
			warmed.current = warm.flatMap((shape) => {
				const result = generateLensMap(shape, lens, scale);
				if (!result) return [];
				decodeLensMap(result, sliced);
				if (light) lightOverlay(result.light);
				return [{ shape: snapShape(shape), key, scale, result }];
			});
		});
	}, [lens, light, mode, sliced, warmKey]);

	const region = width * resolution;
	const regionHeight = height * resolution;
	const insetShadow = drawn(lens.edgeInsetShadow);

	const [first] = useState(() => {
		const box = lensBox(x, y, lensWidth, lensHeight, lensRadius, edgeBias ?? 0);
		const place = {
			transform: `translate3d(${box.left}px, ${box.top}px, 0)`,
			width: box.innerWidth,
			height: box.innerHeight,
			borderRadius: box.radius,
		};
		const shadowAmount = clamp01(read(shadowOpacity ?? 0));
		const bodyOpacity = clamp01(read(tintOpacity ?? 1));
		const r = resolution;
		const copy = {
			visibility: "hidden" as const,
			clipPath: `inset(${box.top * r}px ${(width - box.left - box.innerWidth) * r}px ${(height - box.top - box.innerHeight) * r}px ${box.left * r}px round ${box.radius * r}px)`,
		};
		return {
			place,
			copy,
			shadow: shadowAmount,
			body: openTint + (1 - openTint) * bodyOpacity,
			face: {
				opacity: bodyOpacity,
				clipPath: `inset(${box.top}px ${width - box.left - box.innerWidth}px ${height - box.top - box.innerHeight}px ${box.left}px round ${box.radius}px)`,
			},
		};
	});

	return (
		<div
			ref={rootRef}
			className={["glass", className].filter(Boolean).join(" ")}
			style={{ ...style, width, height }}
			data-glass=""
		>
			<div className="glass__content">{children}</div>

			{mode === "backdrop" ? (
				<div ref={layerRef} className="glass__backdrop" />
			) : mode === "copy" && refractionTarget ? (
				<div
					ref={layerRef}
					className="glass__target"
					style={{
						...first.copy,
						width: region,
						height: regionHeight,
						transform: `scale(${1 / resolution})`,
					}}
				>
					<div
						className="glass__target-inner"
						style={{ width, height, transform: `scale(${resolution})` }}
					>
						{refractionTarget}
					</div>
				</div>
			) : null}

			<svg
				className="glass__defs"
				viewBox={`0 0 ${width} ${height}`}
				aria-hidden="true"
			>
				<defs>
					<filter
						ref={filterRef}
						id={baseId}
						filterUnits="objectBoundingBox"
						primitiveUnits="userSpaceOnUse"
						colorInterpolationFilters="sRGB"
						x="0"
						y="0"
						width="1"
						height="1"
					>
						<LensPrimitives
							dished={dished}
							sliced={sliced}
							frosted={frostInFilter}
							lagged={lag !== undefined}
							split={lens.dispersion > 0}
							shaded={!light}
							clear={mode === "copy"}
						/>
					</filter>
				</defs>
			</svg>

			<div
				ref={frostRef}
				className="glass__frost"
				style={{ display: "none" }}
			/>
			<div
				ref={tintRef}
				className="glass__tint"
				style={{ ...first.place, opacity: first.body, background: tintColor }}
			/>
			{face ? (
				<div
					ref={faceRef}
					className="glass__face"
					style={{ width, height, ...first.face }}
				>
					{face}
				</div>
			) : null}
			{light || targeted ? (
				<div
					ref={lightRef}
					className="glass__light"
					style={{ ...first.place, display: "none" }}
				/>
			) : null}

			{drawn(lens.restEdgeShadow) ? (
				<div
					ref={restShadowRef}
					className="glass__rim"
					style={{
						...first.place,
						boxShadow: lens.restEdgeShadow,
						opacity: 1 - first.shadow,
					}}
				/>
			) : null}

			<div
				ref={shadowRef}
				className="glass__rim"
				style={{
					...first.place,
					boxShadow: [
						drawn(lens.edgeShadow),
						insetShadow ? `inset ${insetShadow}` : undefined,
					]
						.filter(Boolean)
						.join(", "),
					opacity: first.shadow,
				}}
			/>
		</div>
	);
}

const SLICES = [0, 1, 2] as const;

function SliceImages({ name }: { name: "map" | "light" }) {
	return SLICES.map((index) => (
		<feImage
			key={index}
			data-slice={name}
			preserveAspectRatio="none"
			result={`${name}${index}`}
		/>
	));
}

function OnGround({
	ground,
	name,
	pieces,
	result,
}: {
	ground: string;
	name: "map" | "light";
	pieces: number;
	result: string;
}) {
	return (
		<feMerge result={result}>
			<feMergeNode in={ground} />
			{SLICES.slice(0, pieces).map((index) => (
				<feMergeNode key={index} in={`${name}${index}`} />
			))}
		</feMerge>
	);
}

function LensPrimitives({
	dished,
	sliced,
	frosted,
	lagged,
	split,
	shaded,
	clear,
}: {
	dished: boolean;
	sliced: boolean;
	frosted: boolean;
	lagged: boolean;
	split: boolean;
	shaded: boolean;
	clear: boolean;
}) {
	const source = lagged ? "lagged" : "SourceGraphic";
	const rimSource = frosted ? "frosted" : source;
	const bent = dished ? "bent" : "refracted";
	// Over a see-through source, a channel that bends past the content would
	// read as black and fringe the edge, so it falls back to the content below.
	const filled = (name: string) => (clear ? `${name}Filled` : name);
	const fill = (name: string) =>
		clear ? (
			<feComposite
				in={name}
				in2="SourceGraphic"
				operator="over"
				result={`${name}Filled`}
			/>
		) : null;
	return (
		<>
			{lagged ? (
				<feOffset
					data-reach=""
					data-pass="lag"
					in="SourceGraphic"
					dx={0}
					dy={0}
					result="lagged"
				/>
			) : null}
			<feFlood data-reach="" floodColor="rgb(128,128,0)" result="mapGround" />
			{sliced ? (
				<SliceImages name="map" />
			) : (
				<feImage
					data-lens=""
					data-map="rim"
					preserveAspectRatio="none"
					result="map0"
				/>
			)}
			<OnGround
				ground="mapGround"
				name="map"
				pieces={sliced ? 3 : 1}
				result="rawRim"
			/>
			{frosted ? (
				<>
					<feColorMatrix
						data-lens=""
						in="rawRim"
						type="matrix"
						values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 1 0 0"
						result="outline"
					/>
					<feGaussianBlur
						data-reach=""
						data-pass="frost"
						in={source}
						stdDeviation={0}
						edgeMode="duplicate"
						result="blurred"
					/>
					<feColorMatrix
						data-reach=""
						data-pass="saturate"
						in="blurred"
						type="saturate"
						values="1"
						result="saturated"
					/>
					<feComposite
						data-reach=""
						in="saturated"
						in2="outline"
						operator="in"
						result="frostInLens"
					/>
					<feComposite
						data-reach=""
						in="frostInLens"
						in2={source}
						operator="over"
						result="frosted"
					/>
				</>
			) : null}
			{split ? (
				<>
					<feDisplacementMap
						data-rim=""
						data-pass="rim"
						in={rimSource}
						in2="rawRim"
						scale={0}
						xChannelSelector="R"
						yChannelSelector="G"
						result="bentR"
					/>
					{fill("bentR")}
					<feColorMatrix
						in={filled("bentR")}
						type="matrix"
						values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1"
						result="onlyR"
					/>
					<feDisplacementMap
						data-rim=""
						data-pass="rim"
						in={rimSource}
						in2="rawRim"
						scale={0}
						xChannelSelector="R"
						yChannelSelector="G"
						result="bentG"
					/>
					<feColorMatrix
						in="bentG"
						type="matrix"
						values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 0 1"
						result="onlyG"
					/>
					<feDisplacementMap
						data-rim=""
						data-pass="rim"
						in={rimSource}
						in2="rawRim"
						scale={0}
						xChannelSelector="R"
						yChannelSelector="G"
						result="bentB"
					/>
					{fill("bentB")}
					<feColorMatrix
						in={filled("bentB")}
						type="matrix"
						values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 0 1"
						result="onlyB"
					/>
					<feComposite
						in="onlyR"
						in2="onlyG"
						operator="arithmetic"
						k2="1"
						k3="1"
						result="rg"
					/>
					<feComposite
						in="rg"
						in2="onlyB"
						operator="arithmetic"
						k2="1"
						k3="1"
						result="rgb"
					/>
					<feComposite in="rgb" in2="bentG" operator="in" result={bent} />
				</>
			) : (
				<feDisplacementMap
					data-rim=""
					data-pass="rim"
					in={rimSource}
					in2="rawRim"
					scale={0}
					xChannelSelector="R"
					yChannelSelector="G"
					result={bent}
				/>
			)}
			{dished ? (
				<feConvolveMatrix
					data-rim=""
					data-soften=""
					in={bent}
					order="3"
					kernelMatrix={IDENTITY_KERNEL}
					edgeMode="duplicate"
					result="refracted"
				/>
			) : null}

			{shaded ? (
				<>
					<feFlood
						data-reach=""
						floodColor="rgb(128,128,128)"
						result="lightGround"
					/>
					{sliced ? (
						<SliceImages name="light" />
					) : (
						<feImage
							data-lens=""
							data-map="light"
							preserveAspectRatio="none"
							result="light0"
						/>
					)}
					<OnGround
						ground="lightGround"
						name="light"
						pieces={sliced ? 3 : 1}
						result="light"
					/>
					{/* A blend over transparent pixels returns the light itself, so the
					    light is kept to what the lens bent. */}
					<feComposite
						data-lens=""
						in="light"
						in2="refracted"
						operator="in"
						result="lightOnBent"
					/>
					<feBlend
						data-lens=""
						mode="hard-light"
						in="lightOnBent"
						in2="refracted"
						result="lit"
					/>
				</>
			) : null}
			{/* Kept even over opaque content: without it Chromium's GPU cost balloons while scrolling. */}
			<feComposite
				data-lens=""
				in={shaded ? "lit" : "refracted"}
				in2="SourceGraphic"
				operator="in"
				result="lensResult"
			/>

			<feComposite in="lensResult" in2="SourceGraphic" operator="over" />
		</>
	);
}
