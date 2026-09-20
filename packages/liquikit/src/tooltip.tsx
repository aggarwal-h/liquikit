"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { type ReactNode, useMemo, useRef, useState } from "react";
import { Button, type ButtonProps } from "./button";
import type { GlassRefraction, GlassTheme } from "./glass";
import { MorphPane, PopupState } from "./popup";
import { cx } from "./types";
import "./liquikit.css";

export type TooltipRootProps = Omit<BaseTooltip.Root.Props, "open"> & {
	open?: boolean;
};

function Root({
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	...rootProps
}: TooltipRootProps) {
	const [uncontrolled, setUncontrolled] = useState(defaultOpen);
	const open = openProp ?? uncontrolled;
	const trigger = useRef<HTMLElement | null>(null);
	const state = useMemo(() => ({ open, trigger }), [open]);
	return (
		<PopupState.Provider value={state}>
			<BaseTooltip.Root
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
	return <BaseTooltip.Trigger render={<Button {...props} />} />;
}

export type TooltipPopupProps = Omit<
	BaseTooltip.Popup.Props,
	"className" | "render"
> & {
	side?: BaseTooltip.Positioner.Props["side"];
	sideOffset?: number;
	theme?: GlassTheme;
	refraction?: GlassRefraction;
	className?: string;
	children?: ReactNode;
};

function Popup({
	side = "top",
	sideOffset = 8,
	theme,
	refraction,
	className,
	children,
	...popupProps
}: TooltipPopupProps) {
	return (
		<BaseTooltip.Portal>
			<BaseTooltip.Positioner
				className="glass-ui-positioner"
				side={side}
				sideOffset={sideOffset}
			>
				<BaseTooltip.Popup
					{...popupProps}
					className={cx("glass-ui-popup glass-ui-tooltip", className)}
					render={(props) => (
						<MorphPane
							{...props}
							origin="centre"
							panelRadius={14}
							theme={theme}
							refraction={refraction}
						/>
					)}
				>
					<span className="glass-ui-tooltip__text">{children}</span>
				</BaseTooltip.Popup>
			</BaseTooltip.Positioner>
		</BaseTooltip.Portal>
	);
}

export const Tooltip = {
	Provider: BaseTooltip.Provider,
	Root,
	Trigger,
	Popup,
};

export const TooltipProvider = Tooltip.Provider;
export const TooltipRoot = Tooltip.Root;
export const TooltipTrigger = Tooltip.Trigger;
export const TooltipPopup = Tooltip.Popup;
