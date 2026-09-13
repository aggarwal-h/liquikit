"use client";

import {
	createContext,
	type HTMLAttributes,
	type ReactNode,
	type Ref,
	useContext,
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

export type GlassScopeProps = HTMLAttributes<HTMLDivElement> & {
	backdrop?: ReactNode;
	ref?: Ref<HTMLDivElement>;
	children?: ReactNode;
};

export function GlassScope({
	backdrop,
	className,
	ref,
	children,
	...props
}: GlassScopeProps) {
	const rootRef = useRef<HTMLDivElement | null>(null);
	const copied = backdrop !== undefined && backdrop !== null;
	const { pool, render } = useLensPool({
		nested: false,
		enabled: copied,
		element: () => rootRef.current,
		backdrop: () => rootRef.current,
	});

	return (
		<PoolContext.Provider value={copied ? pool : null}>
			<BackdropContext.Provider value={copied ? backdrop : null}>
				<div
					{...props}
					ref={(element) => {
						rootRef.current = element;
						if (typeof ref === "function") ref(element);
						else if (ref) ref.current = element;
					}}
					className={["glass-scope", className].filter(Boolean).join(" ")}
				>
					{copied ? (
						<div aria-hidden="true" className="glass-scope__backdrop">
							{backdrop}
						</div>
					) : null}
					{copied ? render(backdrop) : null}
					{children}
				</div>
			</BackdropContext.Provider>
		</PoolContext.Provider>
	);
}
