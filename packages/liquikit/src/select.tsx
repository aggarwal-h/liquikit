"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { type ReactNode, useMemo, useRef, useState } from "react";
import { Button, type ButtonProps } from "./button";
import type { GlassRefraction, GlassTheme } from "./glass";
import { MorphPane, PopupState, usePopupState } from "./popup";
import { cx } from "./types";
import "./liquikit.css";

export type SelectRootProps<Value> = Omit<
	BaseSelect.Root.Props<Value>,
	"open"
> & {
	open?: boolean;
};

function Root<Value>({
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	...rootProps
}: SelectRootProps<Value>) {
	const [uncontrolled, setUncontrolled] = useState(defaultOpen);
	const open = openProp ?? uncontrolled;
	const trigger = useRef<HTMLElement | null>(null);
	const state = useMemo(() => ({ open, trigger }), [open]);

	return (
		<PopupState.Provider value={state}>
			<BaseSelect.Root
				{...rootProps}
				open={open}
				onOpenChange={(next, eventDetails) => {
					if (openProp === undefined) setUncontrolled(next);
					onOpenChange?.(next, eventDetails);
				}}
			/>
		</PopupState.Provider>
	);
}

export type SelectTriggerProps = Omit<ButtonProps, "children"> & {
	placeholder?: ReactNode;
};

function Trigger({ placeholder, ...props }: SelectTriggerProps) {
	const { trigger } = usePopupState();
	return (
		<BaseSelect.Trigger
			ref={(element: HTMLElement | null) => {
				trigger.current = element;
			}}
			render={
				<Button {...props}>
					<BaseSelect.Value
						className="glass-ui-select__value"
						placeholder={placeholder}
					/>
					<BaseSelect.Icon className="glass-ui-select__icon">
						<svg viewBox="0 0 16 16" aria-hidden="true">
							<path d="M5 6.5 8 3.5l3 3M5 9.5l3 3 3-3" />
						</svg>
					</BaseSelect.Icon>
				</Button>
			}
		/>
	);
}

const overTrigger: NonNullable<BaseSelect.Positioner.Props["sideOffset"]> = ({
	side,
	anchor,
}) => -(side === "top" || side === "bottom" ? anchor.height : anchor.width);

export type SelectPopupProps = Omit<
	BaseSelect.Popup.Props,
	"className" | "render"
> & {
	side?: BaseSelect.Positioner.Props["side"];
	align?: BaseSelect.Positioner.Props["align"];
	sideOffset?: BaseSelect.Positioner.Props["sideOffset"];
	theme?: GlassTheme;
	refraction?: GlassRefraction;
	className?: string;
	children?: ReactNode;
};

function Popup({
	side = "bottom",
	align = "start",
	sideOffset = overTrigger,
	theme,
	refraction,
	className,
	children,
	...popupProps
}: SelectPopupProps) {
	return (
		<BaseSelect.Portal>
			<BaseSelect.Positioner
				className="glass-ui-positioner glass-ui-select__positioner"
				side={side}
				align={align}
				sideOffset={sideOffset}
				alignItemWithTrigger={false}
			>
				<BaseSelect.Popup
					{...popupProps}
					className={cx("glass-ui-popup glass-ui-menu", className)}
					render={(props) => (
						<MorphPane {...props} theme={theme} refraction={refraction} />
					)}
				>
					<BaseSelect.List className="glass-ui-menu__list">
						{children}
					</BaseSelect.List>
				</BaseSelect.Popup>
			</BaseSelect.Positioner>
		</BaseSelect.Portal>
	);
}

function Item({
	className,
	children,
	...itemProps
}: Omit<BaseSelect.Item.Props, "className"> & { className?: string }) {
	return (
		<BaseSelect.Item
			{...itemProps}
			className={cx("glass-ui-menu__item glass-ui-menu__check", className)}
		>
			<span className="glass-ui-select__slot" aria-hidden="true">
				<BaseSelect.ItemIndicator className="glass-ui-select__indicator">
					<svg viewBox="0 0 16 16" aria-hidden="true">
						<path d="M3.5 8.5l3 3 6-7" />
					</svg>
				</BaseSelect.ItemIndicator>
			</span>
			<BaseSelect.ItemText className="glass-ui-menu__text">
				{children}
			</BaseSelect.ItemText>
		</BaseSelect.Item>
	);
}

function Separator({
	className,
	...separatorProps
}: Omit<BaseSelect.Separator.Props, "className"> & { className?: string }) {
	return (
		<BaseSelect.Separator
			{...separatorProps}
			className={cx("glass-ui-menu__separator", className)}
		/>
	);
}

function Group(props: BaseSelect.Group.Props) {
	return <BaseSelect.Group {...props} />;
}

function GroupLabel({
	className,
	...labelProps
}: Omit<BaseSelect.GroupLabel.Props, "className"> & { className?: string }) {
	return (
		<BaseSelect.GroupLabel
			{...labelProps}
			className={cx("glass-ui-menu__label", className)}
		/>
	);
}

export const Select = {
	Root,
	Trigger,
	Popup,
	Item,
	Separator,
	Group,
	GroupLabel,
};

export const SelectRoot = Select.Root;
export const SelectTrigger = Select.Trigger;
export const SelectPopup = Select.Popup;
export const SelectItem = Select.Item;
export const SelectSeparator = Select.Separator;
export const SelectGroup = Select.Group;
export const SelectGroupLabel = Select.GroupLabel;
