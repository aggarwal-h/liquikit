"use client";

import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import { type ReactNode, useMemo, useRef, useState } from "react";
import type { GlassRefraction, GlassTheme } from "./glass";
import { MorphPane, PopupState, usePopupState } from "./popup";
import { cx } from "./types";
import "./liquikit.css";

export type PreviewCardRootProps = Omit<BasePreviewCard.Root.Props, "open"> & {
	open?: boolean;
};

function Root({
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	...rootProps
}: PreviewCardRootProps) {
	const [uncontrolled, setUncontrolled] = useState(defaultOpen);
	const open = openProp ?? uncontrolled;
	const trigger = useRef<HTMLElement | null>(null);
	const state = useMemo(() => ({ open, trigger }), [open]);
	return (
		<PopupState.Provider value={state}>
			<BasePreviewCard.Root
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
	...triggerProps
}: Omit<BasePreviewCard.Trigger.Props, "className"> & { className?: string }) {
	const { trigger } = usePopupState();
	return (
		<BasePreviewCard.Trigger
			{...triggerProps}
			ref={(element: HTMLElement | null) => {
				trigger.current = element;
			}}
			className={cx("glass-ui-link", className)}
		/>
	);
}

export type PreviewCardPopupProps = Omit<
	BasePreviewCard.Popup.Props,
	"className" | "render"
> & {
	side?: BasePreviewCard.Positioner.Props["side"];
	sideOffset?: number;
	theme?: GlassTheme;
	refraction?: GlassRefraction;
	className?: string;
	children?: ReactNode;
};

function Popup({
	side = "bottom",
	sideOffset = 10,
	theme,
	refraction,
	className,
	children,
	...popupProps
}: PreviewCardPopupProps) {
	return (
		<BasePreviewCard.Portal>
			<BasePreviewCard.Positioner
				className="glass-ui-positioner"
				side={side}
				sideOffset={sideOffset}
			>
				<BasePreviewCard.Popup
					{...popupProps}
					className={cx("glass-ui-popup glass-ui-preview", className)}
					render={(props) => (
						<MorphPane
							{...props}
							panelRadius={24}
							theme={theme}
							refraction={refraction}
						/>
					)}
				>
					<div className="glass-ui-preview__body">{children}</div>
				</BasePreviewCard.Popup>
			</BasePreviewCard.Positioner>
		</BasePreviewCard.Portal>
	);
}

export const PreviewCard = { Root, Trigger, Popup };

export const PreviewCardRoot = PreviewCard.Root;
export const PreviewCardTrigger = PreviewCard.Trigger;
export const PreviewCardPopup = PreviewCard.Popup;
