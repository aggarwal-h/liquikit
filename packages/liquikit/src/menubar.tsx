"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Menubar as BaseMenubar } from "@base-ui/react/menubar";
import { type CSSProperties, type ReactNode, useState } from "react";
import { GlassPane, type GlassRefraction } from "./glass";
import { Menu, MenuPlacement } from "./menu";
import { type GlassHandoff, Handoff, usePopupState } from "./popup";
import { cx, type GlassOptions } from "./types";
import "./liquikit.css";

const BELOW = { side: "bottom", align: "start", sideOffset: 10 } as const;

export type MenubarRootProps = Omit<
	BaseMenubar.Props,
	"className" | "style" | "render"
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
	...barProps
}: MenubarRootProps) {
	const [handoff] = useState<GlassHandoff>(() => ({
		panel: { current: null },
		open: { current: 0 },
	}));
	return (
		<Handoff.Provider value={handoff}>
			<MenuPlacement.Provider value={BELOW}>
				<BaseMenubar
					{...barProps}
					className={cx("glass-ui-menubar", className)}
					style={style}
					render={(props) => (
						<GlassPane
							{...props}
							radius="capsule"
							theme={theme}
							lens={lens}
							liquid={liquid}
							refraction={refraction}
						/>
					)}
				>
					<span className="glass-ui-menubar__row">{children}</span>
				</BaseMenubar>
			</MenuPlacement.Provider>
		</Handoff.Provider>
	);
}

function Trigger({
	className,
	...triggerProps
}: Omit<BaseMenu.Trigger.Props, "className"> & { className?: string }) {
	const { trigger } = usePopupState();
	return (
		<BaseMenu.Trigger
			{...triggerProps}
			ref={(element: HTMLElement | null) => {
				trigger.current = element;
			}}
			className={cx(
				"glass-ui-toolbar__button glass-ui-menubar__item",
				className,
			)}
		/>
	);
}

export const Menubar = {
	Root,
	Menu: Menu.Root,
	Trigger,
	Popup: Menu.Popup,
};

export const MenubarRoot = Menubar.Root;
export const MenubarMenu = Menubar.Menu;
export const MenubarTrigger = Menubar.Trigger;
export const MenubarPopup = Menubar.Popup;
