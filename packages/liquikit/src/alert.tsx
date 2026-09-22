"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import {
	type ComponentProps,
	type ReactNode,
	useMemo,
	useRef,
	useState,
} from "react";
import { Button, type ButtonProps } from "./button";
import type { GlassRefraction, GlassTheme } from "./glass";
import { useGlassTheme } from "./glass";
import { MorphPane, PopupState } from "./popup";
import { cx } from "./types";
import "./liquikit.css";

const ALERT_RADIUS = 30;

export type AlertRootProps = Omit<AlertDialog.Root.Props, "open"> & {
	open?: boolean;
};

function Root({
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	...rootProps
}: AlertRootProps) {
	const [uncontrolled, setUncontrolled] = useState(defaultOpen);
	const open = openProp ?? uncontrolled;
	const trigger = useRef<HTMLElement | null>(null);
	const state = useMemo(() => ({ open, trigger }), [open]);

	return (
		<PopupState.Provider value={state}>
			<AlertDialog.Root
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
	return <AlertDialog.Trigger render={<Button {...props} />} />;
}

export type AlertPopupProps = Omit<
	AlertDialog.Popup.Props,
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
}: AlertPopupProps) {
	const backdropTheme = useGlassTheme(theme);
	return (
		<AlertDialog.Portal>
			<AlertDialog.Backdrop
				className="glass-ui-alert__backdrop"
				data-glass-theme={backdropTheme}
			/>
			<AlertDialog.Viewport className="glass-ui-alert__viewport">
				<AlertDialog.Popup
					{...popupProps}
					className={cx("glass-ui-popup glass-ui-alert", className)}
					render={(props) => (
						<MorphPane
							{...props}
							origin="centre"
							panelRadius={ALERT_RADIUS}
							theme={theme}
							refraction={refraction}
						/>
					)}
				>
					<div className="glass-ui-alert__body">{children}</div>
				</AlertDialog.Popup>
			</AlertDialog.Viewport>
		</AlertDialog.Portal>
	);
}

function Title({
	className,
	...titleProps
}: Omit<AlertDialog.Title.Props, "className"> & { className?: string }) {
	return (
		<AlertDialog.Title
			{...titleProps}
			className={cx("glass-ui-alert__title", className)}
		/>
	);
}

function Description({
	className,
	...descriptionProps
}: Omit<AlertDialog.Description.Props, "className"> & { className?: string }) {
	return (
		<AlertDialog.Description
			{...descriptionProps}
			className={cx("glass-ui-alert__description", className)}
		/>
	);
}

function Actions({ className, ...props }: ComponentProps<"div">) {
	return (
		<div {...props} className={cx("glass-ui-alert__actions", className)} />
	);
}

function Close({ block = true, ...props }: ButtonProps) {
	return <AlertDialog.Close render={<Button block={block} {...props} />} />;
}

export const Alert = {
	Root,
	Trigger,
	Popup,
	Title,
	Description,
	Actions,
	Close,
};

export const AlertRoot = Alert.Root;
export const AlertTrigger = Alert.Trigger;
export const AlertPopup = Alert.Popup;
export const AlertTitle = Alert.Title;
export const AlertDescription = Alert.Description;
export const AlertActions = Alert.Actions;
export const AlertClose = Alert.Close;
