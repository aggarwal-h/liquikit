"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import { type ReactNode, useMemo, useRef, useState } from "react";
import { Button, type ButtonProps } from "./button";
import type { GlassRefraction, GlassTheme } from "./glass";
import { MorphPane, PopupState, usePopupState } from "./popup";
import { cx } from "./types";
import "./liquikit.css";

export type PopoverRootProps = Omit<BasePopover.Root.Props, "open"> & {
	open?: boolean;
};

function Root({
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	...rootProps
}: PopoverRootProps) {
	const [uncontrolled, setUncontrolled] = useState(defaultOpen);
	const open = openProp ?? uncontrolled;
	const trigger = useRef<HTMLElement | null>(null);
	const state = useMemo(() => ({ open, trigger }), [open]);

	return (
		<PopupState.Provider value={state}>
			<BasePopover.Root
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

function Trigger(props: ButtonProps) {
	const { trigger } = usePopupState();
	return (
		<BasePopover.Trigger
			ref={(element: HTMLElement | null) => {
				trigger.current = element;
			}}
			render={<Button {...props} />}
		/>
	);
}

export type PopoverPopupProps = Omit<
	BasePopover.Popup.Props,
	"className" | "render"
> & {
	side?: BasePopover.Positioner.Props["side"];
	align?: BasePopover.Positioner.Props["align"];
	sideOffset?: number;
	theme?: GlassTheme;
	refraction?: GlassRefraction;
	className?: string;
	children?: ReactNode;
};

function Popup({
	side = "bottom",
	align = "center",
	sideOffset = 10,
	theme,
	refraction,
	className,
	children,
	...popupProps
}: PopoverPopupProps) {
	return (
		<BasePopover.Portal>
			<BasePopover.Positioner
				className="glass-ui-positioner"
				side={side}
				align={align}
				sideOffset={sideOffset}
			>
				<BasePopover.Popup
					{...popupProps}
					className={cx("glass-ui-popup glass-ui-popover", className)}
					render={(props) => (
						<MorphPane
							{...props}
							panelRadius={26}
							theme={theme}
							refraction={refraction}
						/>
					)}
				>
					<div className="glass-ui-popover__body">{children}</div>
				</BasePopover.Popup>
			</BasePopover.Positioner>
		</BasePopover.Portal>
	);
}

function Title({
	className,
	...titleProps
}: Omit<BasePopover.Title.Props, "className"> & { className?: string }) {
	return (
		<BasePopover.Title
			{...titleProps}
			className={cx("glass-ui-popover__title", className)}
		/>
	);
}

function Description({
	className,
	...descriptionProps
}: Omit<BasePopover.Description.Props, "className"> & { className?: string }) {
	return (
		<BasePopover.Description
			{...descriptionProps}
			className={cx("glass-ui-popover__description", className)}
		/>
	);
}

function Close({ size = "small", ...props }: ButtonProps) {
	return <BasePopover.Close render={<Button size={size} {...props} />} />;
}

export const Popover = { Root, Trigger, Popup, Title, Description, Close };

export const PopoverRoot = Popover.Root;
export const PopoverTrigger = Popover.Trigger;
export const PopoverPopup = Popover.Popup;
export const PopoverTitle = Popover.Title;
export const PopoverDescription = Popover.Description;
export const PopoverClose = Popover.Close;
