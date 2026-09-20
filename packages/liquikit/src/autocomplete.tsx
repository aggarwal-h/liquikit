"use client";

import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import {
	type CSSProperties,
	type ReactNode,
	useMemo,
	useRef,
	useState,
} from "react";
import { useFocusGlass } from "./field";
import { GlassPane, type GlassRefraction, type GlassTheme } from "./glass";
import { MorphPane, PopupState, usePopupState } from "./popup";
import { cx, type GlassOptions, mergeRefs } from "./types";
import "./liquikit.css";

type Classed<P> = Omit<P, "className"> & { className?: string };

export type AutocompleteRootProps<Value> = Omit<
	BaseAutocomplete.Root.Props<Value>,
	"open"
> & {
	open?: boolean;
};

function Root<Value>({
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	...rootProps
}: AutocompleteRootProps<Value>) {
	const [uncontrolled, setUncontrolled] = useState(defaultOpen);
	const open = openProp ?? uncontrolled;
	const trigger = useRef<HTMLElement | null>(null);
	const state = useMemo(() => ({ open, trigger }), [open]);
	return (
		<PopupState.Provider value={state}>
			<BaseAutocomplete.Root
				{...(rootProps as BaseAutocomplete.Root.Props<Value> & {
					items?: readonly Value[];
				})}
				open={open}
				onOpenChange={(next, eventDetails) => {
					if (openProp === undefined) setUncontrolled(next);
					onOpenChange?.(next, eventDetails);
				}}
			/>
		</PopupState.Provider>
	);
}

export type AutocompleteInputProps = Omit<
	BaseAutocomplete.Input.Props,
	"className" | "style" | "render"
> &
	GlassOptions & {
		refraction?: GlassRefraction;
		className?: string;
		style?: CSSProperties;
	};

function Input({
	theme,
	lens,
	liquid,
	refraction,
	className,
	style,
	onFocus,
	onBlur,
	...inputProps
}: AutocompleteInputProps) {
	const { trigger } = usePopupState();
	const focus = useFocusGlass();
	return (
		<BaseAutocomplete.InputGroup
			className={cx("glass-ui-combo", className)}
			style={style}
			render={(props) => (
				<GlassPane
					{...props}
					ref={mergeRefs(props.ref, (element: HTMLElement | null) => {
						trigger.current = element;
					})}
					radius="capsule"
					press={focus.press}
					theme={theme}
					lens={lens}
					liquid={liquid}
					refraction={refraction}
				/>
			)}
		>
			<span className="glass-ui-combo__row">
				<svg
					className="glass-ui-search__icon"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<circle cx="11" cy="11" r="6.5" />
					<path d="m16 16 4.5 4.5" />
				</svg>
				<BaseAutocomplete.Input
					{...inputProps}
					className="glass-ui-combo__input"
					onFocus={(event) => {
						onFocus?.(event);
						focus.onFocus();
					}}
					onBlur={(event) => {
						onBlur?.(event);
						focus.onBlur();
					}}
				/>
				<BaseAutocomplete.Clear
					className="glass-ui-search__clear glass-ui-combo__clear"
					aria-label="Clear"
				>
					<svg viewBox="0 0 16 16" aria-hidden="true">
						<path d="m5.5 5.5 5 5m0-5-5 5" />
					</svg>
				</BaseAutocomplete.Clear>
			</span>
		</BaseAutocomplete.InputGroup>
	);
}

export type AutocompletePopupProps = Omit<
	BaseAutocomplete.Popup.Props,
	"className" | "render"
> & {
	empty?: ReactNode;
	theme?: GlassTheme;
	refraction?: GlassRefraction;
	className?: string;
	children?: ReactNode;
};

function Popup({
	empty,
	theme,
	refraction,
	className,
	children,
	...popupProps
}: AutocompletePopupProps) {
	return (
		<BaseAutocomplete.Portal>
			<BaseAutocomplete.Positioner
				className="glass-ui-positioner glass-ui-combo__positioner"
				sideOffset={8}
				align="start"
			>
				<BaseAutocomplete.Popup
					{...popupProps}
					className={cx("glass-ui-popup glass-ui-menu", className)}
					render={(props) => (
						<MorphPane {...props} theme={theme} refraction={refraction} />
					)}
				>
					{empty ? (
						<BaseAutocomplete.Empty className="glass-ui-combo__empty">
							{empty}
						</BaseAutocomplete.Empty>
					) : null}
					{children}
				</BaseAutocomplete.Popup>
			</BaseAutocomplete.Positioner>
		</BaseAutocomplete.Portal>
	);
}

function List({ className, ...props }: Classed<BaseAutocomplete.List.Props>) {
	return (
		<BaseAutocomplete.List
			{...props}
			className={cx("glass-ui-menu__list glass-ui-combo__list", className)}
		/>
	);
}

function Item({
	className,
	children,
	...itemProps
}: Classed<BaseAutocomplete.Item.Props> & { children?: ReactNode }) {
	return (
		<BaseAutocomplete.Item
			{...itemProps}
			className={cx("glass-ui-menu__item", className)}
		>
			<span className="glass-ui-menu__text">{children}</span>
		</BaseAutocomplete.Item>
	);
}

export const Autocomplete = { Root, Input, Popup, List, Item };

export const AutocompleteRoot = Autocomplete.Root;
export const AutocompleteInput = Autocomplete.Input;
export const AutocompletePopup = Autocomplete.Popup;
export const AutocompleteList = Autocomplete.List;
export const AutocompleteItem = Autocomplete.Item;
