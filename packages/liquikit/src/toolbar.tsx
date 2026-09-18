"use client";

import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import type { CSSProperties, ReactNode } from "react";
import { GlassPane, type GlassRefraction } from "./glass";
import { cx, type GlassOptions } from "./types";
import "./liquikit.css";

export type ToolbarRootProps = Omit<
	BaseToolbar.Root.Props,
	"className" | "style" | "render" | "orientation"
> &
	GlassOptions & {
		refraction?: GlassRefraction;
		className?: string;
		style?: CSSProperties;
		children?: ReactNode;
	};

function Root({
	theme,
	lens,
	liquid,
	refraction,
	className,
	style,
	children,
	...rootProps
}: ToolbarRootProps) {
	return (
		<BaseToolbar.Root
			{...rootProps}
			className={cx("glass-ui-toolbar", className)}
			style={style}
		>
			<GlassPane
				radius="capsule"
				theme={theme}
				lens={lens}
				liquid={liquid}
				refraction={refraction}
			>
				<div className="glass-ui-toolbar__row">{children}</div>
			</GlassPane>
		</BaseToolbar.Root>
	);
}

export type ToolbarButtonProps = Omit<
	BaseToolbar.Button.Props,
	"className" | "render"
> & {
	icon?: boolean;
	className?: string;
};

function Button({
	icon = false,
	className,
	...buttonProps
}: ToolbarButtonProps) {
	return (
		<BaseToolbar.Button
			{...buttonProps}
			className={cx("glass-ui-toolbar__button", className)}
			data-icon={icon ? "" : undefined}
		/>
	);
}

function Separator({
	className,
	...separatorProps
}: Omit<BaseToolbar.Separator.Props, "className"> & { className?: string }) {
	return (
		<BaseToolbar.Separator
			{...separatorProps}
			className={cx("glass-ui-toolbar__separator", className)}
		/>
	);
}

function Group({
	className,
	...groupProps
}: Omit<BaseToolbar.Group.Props, "className"> & { className?: string }) {
	return (
		<BaseToolbar.Group
			{...groupProps}
			className={cx("glass-ui-toolbar__group", className)}
		/>
	);
}

export const Toolbar = { Root, Button, Separator, Group };

export const ToolbarRoot = Toolbar.Root;
export const ToolbarButton = Toolbar.Button;
export const ToolbarSeparator = Toolbar.Separator;
export const ToolbarGroup = Toolbar.Group;
