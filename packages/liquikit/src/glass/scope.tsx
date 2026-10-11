"use client";

import {
	createContext,
	type HTMLAttributes,
	type ReactNode,
	type Ref,
	useContext,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";

export type GlassLens = {
	index: number;
	box: HTMLDivElement;
	frost: HTMLDivElement;
	copy: HTMLDivElement;
	margin: number;
	feather: number;
};

export type LensPool = {
	nested: boolean;
	element: () => HTMLElement | null;
	backdrop: () => HTMLElement | null;
	lease: () => GlassLens | null;
	release: (lens: GlassLens) => void;
	onChange: (listener: () => void) => () => void;
	// Content scopes: the filtered layer, and the filter each glass in use hands it.
	inPlace?: boolean;
	applyFilter?: (key: string, filter: SVGFilterElement | null) => void;
};

const PoolContext = createContext<LensPool | null>(null);
const BackdropContext = createContext<ReactNode>(null);

export const LensPoolProvider = PoolContext.Provider;

export function useGlassScope() {
	return useContext(PoolContext);
}

export function useGlassBackdrop() {
	return useContext(BackdropContext);
}

export function offsetWithin(element: Element, scope: HTMLElement) {
	const inner = element.getBoundingClientRect();
	const outer = scope.getBoundingClientRect();
	const scale =
		scope.offsetWidth > 0 && outer.width > 0
			? outer.width / scope.offsetWidth
			: 1;
	return {
		x: (inner.left - outer.left) / scale - scope.clientLeft,
		y: (inner.top - outer.top) / scale - scope.clientTop,
		width: outer.width / scale - scope.clientLeft * 2,
		height: outer.height / scale - scope.clientTop * 2,
	};
}

const BACKGROUND = [
	"backgroundColor",
	"backgroundImage",
	"backgroundSize",
	"backgroundPosition",
	"backgroundRepeat",
	"backgroundOrigin",
	"backgroundClip",
] as const;

// The copy covers the backdrop rather than adding to it, so it starts from the
// scope's own background: a translucent backdrop would otherwise draw twice.
function underlay(copy: HTMLElement, scope: HTMLElement | null) {
	if (!scope) return;
	const style = getComputedStyle(scope);
	for (const name of BACKGROUND) copy.style[name] = style[name];
}

function idle(box: HTMLElement) {
	box.style.width = "";
	box.style.height = "";
	box.style.filter = "";
}

export function useLensPool({
	nested,
	enabled,
	element,
	backdrop,
	margin = 0,
	feather = 0,
	dress,
}: {
	nested: boolean;
	enabled: boolean;
	element: () => HTMLElement | null;
	backdrop: () => HTMLElement | null;
	margin?: number;
	feather?: number;
	dress?: (lens: GlassLens) => void;
}) {
	const boxes = useRef<Array<HTMLDivElement | null>>([]);
	const frosts = useRef<Array<HTMLDivElement | null>>([]);
	const copies = useRef<Array<HTMLDivElement | null>>([]);
	const taken = useRef(new Set<number>());
	const listeners = useRef(new Set<() => void>());
	const latest = useRef({ element, backdrop, margin, feather, dress });
	latest.current = { element, backdrop, margin, feather, dress };
	const [count, setCount] = useState(0);

	useLayoutEffect(() => {
		if (enabled) setCount((current) => Math.max(current, 1));
	}, [enabled]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: waiting lenses retry whenever the pool grows
	useLayoutEffect(() => {
		for (const listener of listeners.current) listener();
	}, [count]);

	const pool = useMemo<LensPool>(
		() => ({
			nested,
			element: () => latest.current.element(),
			backdrop: () => latest.current.backdrop(),
			lease: () => {
				for (let index = 0; index < boxes.current.length; index++) {
					const box = boxes.current[index];
					const frost = frosts.current[index];
					const copy = copies.current[index];
					if (box && frost && copy && !taken.current.has(index)) {
						taken.current.add(index);
						const lens = {
							index,
							box,
							frost,
							copy,
							margin: latest.current.margin,
							feather: latest.current.feather,
						};
						underlay(copy, latest.current.backdrop());
						latest.current.dress?.(lens);
						return lens;
					}
				}
				setCount((current) => Math.max(current, taken.current.size + 1));
				return null;
			},
			release: (lens) => {
				taken.current.delete(lens.index);
				idle(lens.box);
			},
			onChange: (listener) => {
				listeners.current.add(listener);
				return () => listeners.current.delete(listener);
			},
		}),
		[nested],
	);

	const render = (content: ReactNode) =>
		Array.from({ length: count }, (_, index) => (
			<div
				// biome-ignore lint/suspicious/noArrayIndexKey: the pool only grows, so an index names one box for good
				key={index}
				aria-hidden="true"
				className="glass-scope__lens"
				ref={(node) => {
					boxes.current[index] = node;
				}}
			>
				<div
					className="glass-scope__frost"
					ref={(node) => {
						frosts.current[index] = node;
					}}
				>
					<div
						className="glass-scope__copy"
						ref={(node) => {
							copies.current[index] = node;
						}}
					>
						{content}
					</div>
				</div>
			</div>
		));

	return { pool, render };
}

export type GlassScopeRefraction = "content" | "backdrop";

const SVG_NS = "http://www.w3.org/2000/svg";

const SHARED_INPUTS = new Set([
	"SourceGraphic",
	"SourceAlpha",
	"BackgroundImage",
	"BackgroundAlpha",
	"FillPaint",
	"StrokePaint",
]);

const REFERENCE_ATTRIBUTES = new Set(["result", "in", "in2"]);

type MergedLens = {
	source: SVGFilterElement;
	clones: Element[];
	output: string;
	outline: string;
};

// Alpha of a computed colour: rgba() or a `/ alpha` suffix.
function alphaOf(color: string) {
	const slash = color.lastIndexOf("/");
	if (slash >= 0) return Number.parseFloat(color.slice(slash + 1)) || 0;
	const parts = color.replace(/^[a-z]+\(|\)$/g, "").split(",");
	return parts.length >= 4 ? Number.parseFloat(parts[3]) || 0 : 1;
}

function reference(key: string, name: string, value: string) {
	return REFERENCE_ATTRIBUTES.has(name) && !SHARED_INPUTS.has(value)
		? `${key}-${value}`
		: value;
}

// Keeps a clone in step with its source, its results prefixed by lens.
function follow(key: string, source: Element, clone: Element) {
	for (const { name, value } of Array.from(source.attributes)) {
		const next = reference(key, name, value);
		if (clone.getAttribute(name) !== next) clone.setAttribute(name, next);
	}
	for (const { name } of Array.from(clone.attributes)) {
		if (!source.hasAttribute(name)) clone.removeAttribute(name);
	}
	const sourceChildren = Array.from(source.children);
	const cloneChildren = Array.from(clone.children);
	sourceChildren.forEach((child, index) => {
		const twin = cloneChildren[index];
		if (twin) follow(key, child, twin);
	});
}

// A lens's primitives without the ending it uses on its own.
function lensPrimitives(filter: SVGFilterElement) {
	const children = Array.from(filter.children);
	const output = filter.dataset.result;
	if (output) {
		return {
			primitives: children.filter(
				(child) => !child.hasAttribute("data-standalone"),
			),
			output,
			outline: filter.dataset.outline ?? "",
		};
	}
	const last = children[children.length - 1];
	if (last && !last.hasAttribute("result")) {
		return {
			primitives: children.slice(0, -1),
			output: last.getAttribute("in") ?? "",
			outline: "",
		};
	}
	return {
		primitives: children,
		output: last?.getAttribute("result") ?? "",
		outline: "",
	};
}

export type GlassScopeProps = HTMLAttributes<HTMLDivElement> & {
	backdrop?: ReactNode;
	// `content` bends the scope's own content, with one filter over the whole
	// scope. `backdrop` bends a lens-sized copy of `backdrop` and nothing else.
	refraction?: GlassScopeRefraction;
	// With `content`, how far past the scope's edge a lens still bends, in px.
	bleed?: number;
	ref?: Ref<HTMLDivElement>;
	children?: ReactNode;
};

const DEFAULT_BLEED = 40;

export function GlassScope({
	backdrop,
	refraction = "content",
	bleed = DEFAULT_BLEED,
	className,
	ref,
	children,
	...props
}: GlassScopeProps) {
	const rootRef = useRef<HTMLDivElement | null>(null);
	const contentRef = useRef<HTMLDivElement | null>(null);
	const sharedId = `glass-scope-${useId().replaceAll(":", "")}`;
	const inPlace = refraction === "content";
	const copied = backdrop !== undefined && backdrop !== null;
	const { pool, render } = useLensPool({
		nested: false,
		enabled: copied && !inPlace,
		element: () => rootRef.current,
		backdrop: () => rootRef.current,
	});

	// One filter for every lens: two url() filters on one element leave one
	// unrendered in Chromium and WebKit, and WebKit drops a filter around a filtered layer.
	const sharedRef = useRef<SVGFilterElement | null>(null);
	const merged = useRef(new Map<string, MergedLens>());
	const version = useRef(0);
	const inPlacePool = useMemo<LensPool>(
		() => ({
			nested: false,
			inPlace: true,
			element: () => contentRef.current,
			backdrop: () => contentRef.current,
			lease: () => null,
			release: () => {},
			onChange: () => () => {},
			applyFilter: (key, filter) => {
				const shared = sharedRef.current;
				const content = contentRef.current;
				if (!shared || !content) return;
				const lenses = merged.current;
				if (filter === null) {
					const lens = lenses.get(key);
					if (!lens) return;
					lenses.delete(key);
					for (const clone of lens.clones) clone.remove();
				} else {
					const { primitives, output, outline } = lensPrimitives(filter);
					let lens = lenses.get(key);
					if (!lens || lens.source !== filter) {
						if (lens) for (const clone of lens.clones) clone.remove();
						lens = {
							source: filter,
							clones: primitives.map(
								(primitive) => primitive.cloneNode(true) as Element,
							),
							output: "",
							outline: "",
						};
						lenses.set(key, lens);
					}
					lens.output = reference(key, "in", output);
					lens.outline = outline ? reference(key, "in", outline) : "";
					primitives.forEach((primitive, index) => {
						const clone = lens.clones[index];
						if (clone) follow(key, primitive, clone);
					});
				}
				if (lenses.size === 0) {
					content.style.filter = "";
					shared.replaceChildren();
					return;
				}
				// A see-through layer gets the outlines cut out first, or translucent
				// pixels under a lens draw twice. One merged cut: every pass costs in Safari.
				const make = (name: string) =>
					shared.ownerDocument.createElementNS(SVG_NS, name);
				const node = (input: string) => {
					const element = make("feMergeNode");
					element.setAttribute("in", input);
					return element;
				};
				const merge = make("feMerge");
				const nodes: Element[] = [];
				const outlines: string[] = [];
				for (const lens of lenses.values()) {
					nodes.push(...lens.clones);
					if (lens.outline) outlines.push(lens.outline);
					merge.append(node(lens.output));
				}
				const seeThrough =
					alphaOf(getComputedStyle(content).backgroundColor) < 1;
				let rest = "SourceGraphic";
				if (seeThrough && outlines.length) {
					const all = make("feMerge");
					for (const outline of outlines) all.append(node(outline));
					all.setAttribute("result", "outlines");
					const hole = make("feComposite");
					hole.setAttribute("in", "SourceGraphic");
					hole.setAttribute("in2", "outlines");
					hole.setAttribute("operator", "out");
					hole.setAttribute("result", "rest");
					nodes.push(all, hole);
					rest = "rest";
				}
				merge.prepend(node(rest));
				shared.replaceChildren(...nodes, merge);
				// Safari caches filter output by id, so every update takes a fresh one.
				version.current += 1;
				shared.id = `${sharedId}-v${version.current}`;
				content.style.filter = `url(#${shared.id})`;
			},
		}),
		[sharedId],
	);

	return (
		<PoolContext.Provider value={inPlace ? inPlacePool : copied ? pool : null}>
			<BackdropContext.Provider value={copied && !inPlace ? backdrop : null}>
				<div
					{...props}
					ref={(element) => {
						rootRef.current = element;
						if (typeof ref === "function") ref(element);
						else if (ref) ref.current = element;
					}}
					className={[
						"glass-scope",
						inPlace ? "glass-scope--in-place" : undefined,
						className,
					]
						.filter(Boolean)
						.join(" ")}
				>
					{inPlace ? (
						<>
							<svg className="glass-scope__defs" aria-hidden="true">
								<filter
									ref={sharedRef}
									id={sharedId}
									filterUnits="objectBoundingBox"
									primitiveUnits="userSpaceOnUse"
									colorInterpolationFilters="sRGB"
									x="0"
									y="0"
									width="1"
									height="1"
								/>
							</svg>
							<div
								ref={contentRef}
								className="glass-scope__content"
								style={{ margin: -bleed, padding: bleed }}
							>
								<div className="glass-scope__inner">
									{copied ? (
										<div aria-hidden="true" className="glass-scope__backdrop">
											{backdrop}
										</div>
									) : null}
									{children}
								</div>
							</div>
						</>
					) : (
						<>
							{copied ? (
								<div aria-hidden="true" className="glass-scope__backdrop">
									{backdrop}
								</div>
							) : null}
							{copied ? render(backdrop) : null}
							{children}
						</>
					)}
				</div>
			</BackdropContext.Provider>
		</PoolContext.Provider>
	);
}
