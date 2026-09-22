"use client";

import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import {
	type CSSProperties,
	createContext,
	type ReactNode,
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
	type GlassRefraction,
	GlassSegmentedSurface,
	type LensProfile,
	type UseGlassSegmentedResult,
} from "./glass";
import { indicesOf, Name, over } from "./segments";
import { cx, type GlassOptions, type Segment, toSegment } from "./types";
import "./liquikit.css";

const ActiveTab = createContext<{
	value: string | undefined;
	adopt: (value: string) => void;
	select: (value: string) => void;
} | null>(null);

function useActiveTab() {
	const context = useContext(ActiveTab);
	if (!context) throw new Error("Tabs.List must be inside Tabs.Root.");
	return context;
}

export type TabsRootProps = Omit<
	BaseTabs.Root.Props,
	"value" | "defaultValue" | "onValueChange" | "className" | "orientation"
> & {
	value?: string;
	defaultValue?: string;
	onValueChange?: (
		value: string,
		eventDetails?: BaseTabs.Root.ChangeEventDetails,
	) => void;
	className?: string;
};

function Root({
	value,
	defaultValue,
	onValueChange,
	className,
	...rootProps
}: TabsRootProps) {
	const [uncontrolled, setUncontrolled] = useState(defaultValue);
	const current = value ?? uncontrolled;
	const controlled = value !== undefined;
	const adopt = useCallback(
		(first: string) => {
			if (!controlled) setUncontrolled((held) => held ?? first);
		},
		[controlled],
	);
	const latest = useRef({ current, onValueChange });
	latest.current = { current, onValueChange };
	const select = useCallback(
		(next: string) => {
			if (next === latest.current.current) return;
			if (!controlled) setUncontrolled(next);
			latest.current.onValueChange?.(next);
		},
		[controlled],
	);
	const shared = useMemo(
		() => ({ value: current, adopt, select }),
		[adopt, current, select],
	);

	return (
		<ActiveTab.Provider value={shared}>
			<BaseTabs.Root
				{...rootProps}
				value={current ?? null}
				onValueChange={(next, eventDetails) => {
					const chosen = String(next);
					if (value === undefined) setUncontrolled(chosen);
					onValueChange?.(chosen, eventDetails);
				}}
				className={cx("glass-ui-tabs", className)}
			/>
		</ActiveTab.Provider>
	);
}

export type TabsListProps = Omit<
	BaseTabs.List.Props,
	"children" | "render" | "className" | "style"
> &
	GlassOptions & {
		tabs: ReadonlyArray<string | Segment>;
		height?: number;
		className?: string;
		style?: CSSProperties;
	};

function TabRow({
	segments,
	height,
	inset,
	pressScale,
	theme,
	lens,
	liquid,
	className,
}: GlassOptions & {
	segments: Segment[];
	height?: number;
	inset?: number;
	pressScale?: number;
	className?: string;
}) {
	const { value, adopt, select } = useActiveTab();
	const controls = useRef<UseGlassSegmentedResult>(null);
	const first = segments[0]?.value;

	useLayoutEffect(() => {
		if (value === undefined && first !== undefined) adopt(first);
	}, [adopt, first, value]);

	const shown = useRef(value);
	useEffect(() => {
		if (shown.current !== undefined && value !== shown.current) {
			controls.current?.flash();
		}
		shown.current = value;
	}, [value]);

	return (
		<GlassSegmentedSurface
			className={className}
			options={segments}
			selected={indicesOf(segments, [value ?? first])}
			height={height}
			inset={inset}
			pressScale={pressScale}
			lens={lens}
			theme={theme}
			liquid={liquid}
			onDragSelect={(index) => {
				const segment = segments[index];
				if (segment && !segment.disabled) select(segment.value);
			}}
			controlsRef={controls}
			items={(bounds) =>
				segments.map((segment, index) => (
					<BaseTabs.Tab
						key={segment.value}
						value={segment.value}
						disabled={segment.disabled}
						className="glass-segmented__hit glass-ui-item"
						style={over(bounds, index)}
					>
						<Name segment={segment} />
					</BaseTabs.Tab>
				))
			}
		/>
	);
}

const LIST_PRESS_SCALE = 1.8;

function List({
	tabs,
	height,
	theme,
	lens,
	liquid,
	className,
	style,
	...listProps
}: TabsListProps) {
	return (
		<BaseTabs.List
			{...listProps}
			className={cx("glass-ui-segmented", className)}
			style={style}
		>
			<TabRow
				segments={tabs.map(toSegment)}
				height={height}
				pressScale={LIST_PRESS_SCALE}
				theme={theme}
				lens={lens}
				liquid={liquid}
			/>
		</BaseTabs.List>
	);
}

export type TabBarItem = {
	value: string;
	label: string;
	icon: ReactNode;
	disabled?: boolean;
};

export type TabsBarProps = Omit<TabsListProps, "tabs"> & {
	tabs: ReadonlyArray<TabBarItem>;
	refraction?: GlassRefraction;
};

const BAR_LENS: Partial<LensProfile> = {
	restEdgeShadow: "none",
	magnification: 1.12,
	domeLength: 0,
	softness: 0.3,
	base: 8,
};

const BAR_PRESS_SCALE = 1.55;

function Bar({
	tabs,
	height = 50,
	theme,
	lens = BAR_LENS,
	liquid,
	refraction,
	className,
	style,
	...listProps
}: TabsBarProps) {
	const segments = tabs.map<Segment>((tab) => ({
		value: tab.value,
		disabled: tab.disabled,
		label: (
			<span className="glass-ui-tabbar__item">
				<span className="glass-ui-tabbar__icon" aria-hidden="true">
					{tab.icon}
				</span>
				<span className="glass-ui-tabbar__label">{tab.label}</span>
			</span>
		),
	}));

	return (
		<BaseTabs.List
			{...listProps}
			className={cx("glass-ui-tabbar", className)}
			style={style}
		>
			<GlassPane radius="capsule" theme={theme} refraction={refraction}>
				<div className="glass-ui-tabbar__inner">
					<TabRow
						className="glass-ui-tabbar__row"
						segments={segments}
						height={height}
						inset={0}
						pressScale={BAR_PRESS_SCALE}
						theme={theme}
						lens={lens}
						liquid={liquid}
					/>
				</div>
			</GlassPane>
		</BaseTabs.List>
	);
}

export type TabsPanelProps = Omit<
	BaseTabs.Panel.Props,
	"value" | "className"
> & {
	value: string;
	className?: string;
};

function Panel({ className, ...panelProps }: TabsPanelProps) {
	return (
		<BaseTabs.Panel
			{...panelProps}
			className={cx("glass-ui-tabs__panel", className)}
		/>
	);
}

export const Tabs = { Root, List, Bar, Panel };

export const TabsRoot = Tabs.Root;
export const TabsList = Tabs.List;
export const TabsBar = Tabs.Bar;
export const TabsPanel = Tabs.Panel;
