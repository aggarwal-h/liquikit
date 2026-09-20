"use client";

import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { type ReactNode, useMemo, useRef, useState } from "react";
import type { GlassRefraction, GlassTheme } from "./glass";
import { MorphPane, PopupState, usePopupState } from "./popup";
import { cx } from "./types";
import "./liquikit.css";

export type ContextMenuRootProps = Omit<BaseContextMenu.Root.Props, "open"> & {
	open?: boolean;
};

function Root({
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	...rootProps
}: ContextMenuRootProps) {
	const [uncontrolled, setUncontrolled] = useState(defaultOpen);
	const open = openProp ?? uncontrolled;
	const trigger = useRef<HTMLElement | null>(null);
	const point = useRef<{ x: number; y: number } | null>(null);
	const state = useMemo(() => ({ open, trigger, point }), [open]);
	return (
		<PopupState.Provider value={state}>
			<BaseContextMenu.Root
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

function Trigger({
	className,
	onContextMenu,
	onPointerDown,
	...triggerProps
}: Omit<BaseContextMenu.Trigger.Props, "className"> & { className?: string }) {
	const { point } = usePopupState();
	return (
		<BaseContextMenu.Trigger
			{...triggerProps}
			className={cx("glass-ui-context", className)}
			onPointerDown={(event) => {
				onPointerDown?.(event);
				if (point) point.current = { x: event.clientX, y: event.clientY };
			}}
			onContextMenu={(event) => {
				onContextMenu?.(event);
				if (point) point.current = { x: event.clientX, y: event.clientY };
			}}
		/>
	);
}

export type ContextMenuPopupProps = Omit<
	BaseContextMenu.Popup.Props,
	"className" | "render"
> & {
	theme?: GlassTheme;
	refraction?: GlassRefraction;
	className?: string;
	children?: ReactNode;
};

function Popup({
	theme,
	refraction,
	className,
	children,
	...popupProps
}: ContextMenuPopupProps) {
	return (
		<BaseContextMenu.Portal>
			<BaseContextMenu.Positioner className="glass-ui-positioner">
				<BaseContextMenu.Popup
					{...popupProps}
					className={cx("glass-ui-popup glass-ui-menu", className)}
					render={(props) => (
						<MorphPane
							{...props}
							origin="point"
							theme={theme}
							refraction={refraction}
						/>
					)}
				>
					<div className="glass-ui-menu__list">{children}</div>
				</BaseContextMenu.Popup>
			</BaseContextMenu.Positioner>
		</BaseContextMenu.Portal>
	);
}

export const ContextMenu = { Root, Trigger, Popup };

export const ContextMenuRoot = ContextMenu.Root;
export const ContextMenuTrigger = ContextMenu.Trigger;
export const ContextMenuPopup = ContextMenu.Popup;
