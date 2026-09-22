"use client";

import { Drawer } from "@base-ui/react/drawer";
import type { ReactNode } from "react";
import { Button, type ButtonProps } from "./button";
import { GlassPane, type GlassRefraction, type GlassTheme } from "./glass";
import { cx } from "./types";
import "./liquikit.css";

const SHEET_RADIUS = 34;

export type SheetRootProps = Drawer.Root.Props;

function Root({ swipeDirection = "down", ...props }: SheetRootProps) {
	return <Drawer.Root swipeDirection={swipeDirection} {...props} />;
}

function Trigger(props: ButtonProps) {
	return <Drawer.Trigger render={<Button {...props} />} />;
}

export type SheetPopupProps = Omit<
	Drawer.Popup.Props,
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
}: SheetPopupProps) {
	return (
		<Drawer.Portal>
			<Drawer.Backdrop className="glass-ui-sheet__backdrop" />
			<Drawer.Viewport className="glass-ui-sheet__viewport">
				<Drawer.Popup
					{...popupProps}
					className={cx("glass-ui-sheet", className)}
					render={(props) => (
						<GlassPane
							{...props}
							radius={SHEET_RADIUS}
							theme={theme}
							refraction={refraction}
						/>
					)}
				>
					<div className="glass-ui-sheet__handle" aria-hidden="true">
						<div className="glass-ui-sheet__grabber" />
					</div>
					<Drawer.Content className="glass-ui-sheet__content">
						{children}
					</Drawer.Content>
				</Drawer.Popup>
			</Drawer.Viewport>
		</Drawer.Portal>
	);
}

function Title({
	className,
	...titleProps
}: Omit<Drawer.Title.Props, "className"> & { className?: string }) {
	return (
		<Drawer.Title
			{...titleProps}
			className={cx("glass-ui-sheet__title", className)}
		/>
	);
}

function Description({
	className,
	...descriptionProps
}: Omit<Drawer.Description.Props, "className"> & { className?: string }) {
	return (
		<Drawer.Description
			{...descriptionProps}
			className={cx("glass-ui-sheet__description", className)}
		/>
	);
}

function Close({ block = true, ...props }: ButtonProps) {
	return <Drawer.Close render={<Button block={block} {...props} />} />;
}

export const Sheet = { Root, Trigger, Popup, Title, Description, Close };

export const SheetRoot = Sheet.Root;
export const SheetTrigger = Sheet.Trigger;
export const SheetPopup = Sheet.Popup;
export const SheetTitle = Sheet.Title;
export const SheetDescription = Sheet.Description;
export const SheetClose = Sheet.Close;
