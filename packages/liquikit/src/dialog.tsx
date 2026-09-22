"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { type ReactNode, useMemo, useRef, useState } from "react";
import { Button, type ButtonProps } from "./button";
import type { GlassRefraction, GlassTheme } from "./glass";
import { MorphPane, PopupState, usePopupState } from "./popup";
import { cx } from "./types";
import "./liquikit.css";

const DIALOG_RADIUS = 30;

export type DialogRootProps = Omit<BaseDialog.Root.Props, "open"> & {
	open?: boolean;
};

function Root({
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	...rootProps
}: DialogRootProps) {
	const [uncontrolled, setUncontrolled] = useState(defaultOpen);
	const open = openProp ?? uncontrolled;
	const trigger = useRef<HTMLElement | null>(null);
	const state = useMemo(() => ({ open, trigger }), [open]);
	return (
		<PopupState.Provider value={state}>
			<BaseDialog.Root
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
		<BaseDialog.Trigger
			ref={(element: HTMLElement | null) => {
				trigger.current = element;
			}}
			render={<Button {...props} />}
		/>
	);
}

export type DialogPopupProps = Omit<
	BaseDialog.Popup.Props,
	"className" | "render"
> & {
	theme?: GlassTheme;
	refraction?: GlassRefraction;
	closeButton?: boolean;
	className?: string;
	children?: ReactNode;
};

function Popup({
	theme,
	refraction,
	closeButton = true,
	className,
	children,
	...popupProps
}: DialogPopupProps) {
	return (
		<BaseDialog.Portal>
			<BaseDialog.Backdrop className="glass-ui-alert__backdrop" />
			<BaseDialog.Viewport className="glass-ui-alert__viewport">
				<BaseDialog.Popup
					{...popupProps}
					className={cx("glass-ui-popup glass-ui-dialog", className)}
					render={(props) => (
						<MorphPane
							{...props}
							panelRadius={DIALOG_RADIUS}
							theme={theme}
							refraction={refraction}
						/>
					)}
				>
					<div className="glass-ui-dialog__body">
						{closeButton ? (
							<BaseDialog.Close
								className="glass-ui-dialog__close"
								aria-label="Close"
								render={
									<Button icon size="small">
										<svg viewBox="0 0 16 16" aria-hidden="true">
											<path
												d="m4.5 4.5 7 7m0-7-7 7"
												fill="none"
												stroke="currentColor"
												strokeWidth="1.8"
												strokeLinecap="round"
											/>
										</svg>
									</Button>
								}
							/>
						) : null}
						{children}
					</div>
				</BaseDialog.Popup>
			</BaseDialog.Viewport>
		</BaseDialog.Portal>
	);
}

function Title({
	className,
	...titleProps
}: Omit<BaseDialog.Title.Props, "className"> & { className?: string }) {
	return (
		<BaseDialog.Title
			{...titleProps}
			className={cx("glass-ui-sheet__title", className)}
		/>
	);
}

function Description({
	className,
	...descriptionProps
}: Omit<BaseDialog.Description.Props, "className"> & { className?: string }) {
	return (
		<BaseDialog.Description
			{...descriptionProps}
			className={cx("glass-ui-sheet__description", className)}
		/>
	);
}

function Close(props: ButtonProps) {
	return <BaseDialog.Close render={<Button {...props} />} />;
}

export const Dialog = { Root, Trigger, Popup, Title, Description, Close };

export const DialogRoot = Dialog.Root;
export const DialogTrigger = Dialog.Trigger;
export const DialogPopup = Dialog.Popup;
export const DialogTitle = Dialog.Title;
export const DialogDescription = Dialog.Description;
export const DialogClose = Dialog.Close;
