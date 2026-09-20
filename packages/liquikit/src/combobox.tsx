"use client";

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
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

export type ComboboxRootProps<
	Value,
	Multiple extends boolean | undefined,
> = Omit<BaseCombobox.Root.Props<Value, Multiple>, "open"> & {
	open?: boolean;
};

function Root<Value, Multiple extends boolean | undefined = false>({
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	...rootProps
}: ComboboxRootProps<Value, Multiple>) {
	const [uncontrolled, setUncontrolled] = useState(defaultOpen);
	const open = openProp ?? uncontrolled;
	const trigger = useRef<HTMLElement | null>(null);
	const state = useMemo(() => ({ open, trigger }), [open]);
	return (
		<PopupState.Provider value={state}>
			<BaseCombobox.Root
				{...(rootProps as BaseCombobox.Root.Props<Value, Multiple>)}
				open={open}
				onOpenChange={(next, eventDetails) => {
					if (openProp === undefined) setUncontrolled(next);
					onOpenChange?.(next, eventDetails);
				}}
			/>
		</PopupState.Provider>
	);
}

export type ComboboxInputProps = Omit<
	BaseCombobox.Input.Props,
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
}: ComboboxInputProps) {
	const { trigger } = usePopupState();
	const focus = useFocusGlass();
	return (
		<BaseCombobox.InputGroup
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
				<BaseCombobox.Input
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
				<BaseCombobox.Clear
					className="glass-ui-search__clear glass-ui-combo__clear"
					aria-label="Clear"
				>
					<svg viewBox="0 0 16 16" aria-hidden="true">
						<path d="m5.5 5.5 5 5m0-5-5 5" />
					</svg>
				</BaseCombobox.Clear>
				<BaseCombobox.Trigger
					className="glass-ui-combo__trigger"
					aria-label="Show choices"
				>
					<svg viewBox="0 0 16 16" aria-hidden="true">
						<path d="M5 6.5 8 3.5l3 3M5 9.5l3 3 3-3" />
					</svg>
				</BaseCombobox.Trigger>
			</span>
		</BaseCombobox.InputGroup>
	);
}

export type ComboboxChipsProps = GlassOptions & {
	placeholder?: string;
	chipLabel?: (item: unknown) => ReactNode;
	refraction?: GlassRefraction;
	className?: string;
	style?: CSSProperties;
	"aria-label"?: string;
};

function labelOf(item: unknown) {
	if (item && typeof item === "object") {
		const record = item as { label?: unknown; value?: unknown };
		return String(record.label ?? record.value ?? "");
	}
	return String(item);
}

function Chips({
	placeholder,
	chipLabel = labelOf,
	theme,
	lens,
	liquid,
	refraction,
	className,
	style,
	"aria-label": ariaLabel,
}: ComboboxChipsProps) {
	const { trigger } = usePopupState();
	const focus = useFocusGlass();
	return (
		<BaseCombobox.InputGroup
			className={cx("glass-ui-combo glass-ui-combo--chips", className)}
			style={style}
			render={(props) => (
				<GlassPane
					{...props}
					ref={mergeRefs(props.ref, (element: HTMLElement | null) => {
						trigger.current = element;
					})}
					radius={22}
					press={focus.press}
					theme={theme}
					lens={lens}
					liquid={liquid}
					refraction={refraction}
				/>
			)}
		>
			<span className="glass-ui-combo__row glass-ui-combo__row--chips">
				<BaseCombobox.Value>
					{(value: unknown[]) => (
						<BaseCombobox.Chips
							className="glass-ui-combo__chips"
							aria-label={value.length > 0 ? "Selected" : undefined}
						>
							{value.map((item) => {
								const text = labelOf(item);
								return (
									<BaseCombobox.Chip
										key={text}
										className="glass-ui-combo__chip"
										aria-label={text}
										aria-description="Press Backspace or Delete to remove"
									>
										{chipLabel(item)}
										<BaseCombobox.ChipRemove
											className="glass-ui-combo__chip-remove"
											aria-label={`Remove ${text}`}
										>
											<svg viewBox="0 0 16 16" aria-hidden="true">
												<path d="m5 5 6 6m0-6-6 6" />
											</svg>
										</BaseCombobox.ChipRemove>
									</BaseCombobox.Chip>
								);
							})}
							<BaseCombobox.Input
								className="glass-ui-combo__input"
								placeholder={value.length > 0 ? undefined : placeholder}
								aria-label={ariaLabel}
								onFocus={focus.onFocus}
								onBlur={focus.onBlur}
							/>
						</BaseCombobox.Chips>
					)}
				</BaseCombobox.Value>
				<BaseCombobox.Trigger
					className="glass-ui-combo__trigger"
					aria-label="Show choices"
				>
					<svg viewBox="0 0 16 16" aria-hidden="true">
						<path d="M5 6.5 8 3.5l3 3M5 9.5l3 3 3-3" />
					</svg>
				</BaseCombobox.Trigger>
			</span>
		</BaseCombobox.InputGroup>
	);
}

export type ComboboxPopupProps = Omit<
	BaseCombobox.Popup.Props,
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
}: ComboboxPopupProps) {
	return (
		<BaseCombobox.Portal>
			<BaseCombobox.Positioner
				className="glass-ui-positioner glass-ui-combo__positioner"
				sideOffset={8}
				align="start"
			>
				<BaseCombobox.Popup
					{...popupProps}
					className={cx("glass-ui-popup glass-ui-menu", className)}
					render={(props) => (
						<MorphPane {...props} theme={theme} refraction={refraction} />
					)}
				>
					{empty ? (
						<BaseCombobox.Empty className="glass-ui-combo__empty">
							{empty}
						</BaseCombobox.Empty>
					) : null}
					{children}
				</BaseCombobox.Popup>
			</BaseCombobox.Positioner>
		</BaseCombobox.Portal>
	);
}

function List({ className, ...props }: Classed<BaseCombobox.List.Props>) {
	return (
		<BaseCombobox.List
			{...props}
			className={cx("glass-ui-menu__list glass-ui-combo__list", className)}
		/>
	);
}

function Item({
	className,
	children,
	...itemProps
}: Classed<BaseCombobox.Item.Props> & { children?: ReactNode }) {
	return (
		<BaseCombobox.Item
			{...itemProps}
			className={cx("glass-ui-menu__item glass-ui-menu__check", className)}
		>
			<span className="glass-ui-select__slot" aria-hidden="true">
				<BaseCombobox.ItemIndicator className="glass-ui-select__indicator">
					<svg viewBox="0 0 16 16" aria-hidden="true">
						<path d="M3.5 8.5l3 3 6-7" />
					</svg>
				</BaseCombobox.ItemIndicator>
			</span>
			<span className="glass-ui-menu__text">{children}</span>
		</BaseCombobox.Item>
	);
}

export const Combobox = { Root, Input, Chips, Popup, List, Item };

export const ComboboxRoot = Combobox.Root;
export const ComboboxInput = Combobox.Input;
export const ComboboxChips = Combobox.Chips;
export const ComboboxPopup = Combobox.Popup;
export const ComboboxList = Combobox.List;
export const ComboboxItem = Combobox.Item;
