"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import {
	createContext,
	type MouseEvent,
	type ReactNode,
	type RefObject,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import { Button, type ButtonProps } from "./button";
import type { GlassRefraction, GlassTheme } from "./glass";
import { Handoff, MorphPane, PopupState, usePopupState } from "./popup";
import { cx } from "./types";
import "./liquikit.css";

export const PressedAt = createContext<
	RefObject<{ x: number; y: number } | null>
>({
	current: null,
});

const overTrigger: NonNullable<BaseMenu.Positioner.Props["sideOffset"]> = ({
	side,
	anchor,
}) => -(side === "top" || side === "bottom" ? anchor.height : anchor.width);

type Placement = {
	side: BaseMenu.Positioner.Props["side"];
	align: BaseMenu.Positioner.Props["align"];
	sideOffset: BaseMenu.Positioner.Props["sideOffset"];
	alignOffset?: BaseMenu.Positioner.Props["alignOffset"];
};

export const MenuPlacement = createContext<Placement>({
	side: "bottom",
	align: "start",
	sideOffset: overTrigger,
});
const BESIDE: Placement = {
	side: "inline-end",
	align: "start",
	sideOffset: 6,
	alignOffset: -6,
};

export type MenuRootProps = Omit<BaseMenu.Root.Props, "open"> & {
	open?: boolean;
};

function Root({
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	...rootProps
}: MenuRootProps) {
	const [uncontrolled, setUncontrolled] = useState(defaultOpen);
	const open = openProp ?? uncontrolled;
	const trigger = useRef<HTMLElement | null>(null);
	const pressedAt = useRef<{ x: number; y: number } | null>(null);
	const state = useMemo(() => ({ open, trigger }), [open]);

	return (
		<PopupState.Provider value={state}>
			<PressedAt.Provider value={pressedAt}>
				<BaseMenu.Root
					{...rootProps}
					open={open}
					onOpenChange={(next, eventDetails) => {
						if (openProp === undefined) setUncontrolled(next);
						onOpenChange?.(next, eventDetails);
					}}
				/>
			</PressedAt.Provider>
		</PopupState.Provider>
	);
}

function Trigger(props: ButtonProps) {
	const { trigger } = usePopupState();
	const pressedAt = useContext(PressedAt);
	return (
		<BaseMenu.Trigger
			ref={(element: HTMLElement | null) => {
				trigger.current = element;
			}}
			onMouseDown={(event) => {
				pressedAt.current = { x: event.clientX, y: event.clientY };
			}}
			render={<Button {...props} />}
		/>
	);
}

function useStayPut() {
	const pressedAt = useContext(PressedAt);
	return (event: MouseEvent & { preventBaseUIHandler?: () => void }) => {
		const at = pressedAt.current;
		if (!at) return;
		pressedAt.current = null;
		if (Math.hypot(event.clientX - at.x, event.clientY - at.y) < 6) {
			event.preventBaseUIHandler?.();
		}
	};
}

export type MenuPopupProps = Omit<
	BaseMenu.Popup.Props,
	"className" | "render"
> & {
	side?: BaseMenu.Positioner.Props["side"];
	align?: BaseMenu.Positioner.Props["align"];
	sideOffset?: BaseMenu.Positioner.Props["sideOffset"];
	theme?: GlassTheme;
	refraction?: GlassRefraction;
	className?: string;
	children?: ReactNode;
};

function Popup({
	side,
	align,
	sideOffset,
	theme,
	refraction,
	className,
	children,
	...popupProps
}: MenuPopupProps) {
	const placement = useContext(MenuPlacement);
	return (
		<BaseMenu.Portal>
			<BaseMenu.Positioner
				className="glass-ui-positioner"
				side={side ?? placement.side}
				align={align ?? placement.align}
				sideOffset={sideOffset ?? placement.sideOffset}
				alignOffset={placement.alignOffset}
			>
				<BaseMenu.Popup
					{...popupProps}
					className={cx("glass-ui-popup glass-ui-menu", className)}
					render={(props) => (
						<MorphPane {...props} theme={theme} refraction={refraction} />
					)}
				>
					<div className="glass-ui-menu__list">{children}</div>
				</BaseMenu.Popup>
			</BaseMenu.Positioner>
		</BaseMenu.Portal>
	);
}

function Item({
	className,
	icon,
	children,
	onMouseUp,
	...itemProps
}: Omit<BaseMenu.Item.Props, "className"> & {
	className?: string;
	icon?: ReactNode;
}) {
	const stayPut = useStayPut();
	return (
		<BaseMenu.Item
			{...itemProps}
			className={cx("glass-ui-menu__item", className)}
			onMouseUp={(event) => {
				onMouseUp?.(event);
				stayPut(event);
			}}
		>
			<span className="glass-ui-menu__text">{children}</span>
			{icon ? (
				<span className="glass-ui-menu__icon" aria-hidden="true">
					{icon}
				</span>
			) : null}
		</BaseMenu.Item>
	);
}

function CheckboxItem({
	className,
	children,
	onMouseUp,
	...itemProps
}: Omit<BaseMenu.CheckboxItem.Props, "className"> & { className?: string }) {
	const stayPut = useStayPut();
	return (
		<BaseMenu.CheckboxItem
			{...itemProps}
			className={cx("glass-ui-menu__item glass-ui-menu__check", className)}
			onMouseUp={(event) => {
				onMouseUp?.(event);
				stayPut(event);
			}}
		>
			<BaseMenu.CheckboxItemIndicator
				className="glass-ui-menu__tick"
				keepMounted
			>
				<svg viewBox="0 0 16 16" aria-hidden="true">
					<path d="M3.5 8.5l3 3 6-7" />
				</svg>
			</BaseMenu.CheckboxItemIndicator>
			<span className="glass-ui-menu__text">{children}</span>
		</BaseMenu.CheckboxItem>
	);
}

function RadioGroup(props: BaseMenu.RadioGroup.Props) {
	return <BaseMenu.RadioGroup {...props} />;
}

function RadioItem({
	className,
	children,
	onMouseUp,
	...itemProps
}: Omit<BaseMenu.RadioItem.Props, "className"> & { className?: string }) {
	const stayPut = useStayPut();
	return (
		<BaseMenu.RadioItem
			{...itemProps}
			className={cx("glass-ui-menu__item glass-ui-menu__check", className)}
			onMouseUp={(event) => {
				onMouseUp?.(event);
				stayPut(event);
			}}
		>
			<BaseMenu.RadioItemIndicator className="glass-ui-menu__tick" keepMounted>
				<svg viewBox="0 0 16 16" aria-hidden="true">
					<path d="M3.5 8.5l3 3 6-7" />
				</svg>
			</BaseMenu.RadioItemIndicator>
			<span className="glass-ui-menu__text">{children}</span>
		</BaseMenu.RadioItem>
	);
}

function LinkItem({
	className,
	icon,
	children,
	...itemProps
}: Omit<BaseMenu.LinkItem.Props, "className"> & {
	className?: string;
	icon?: ReactNode;
}) {
	return (
		<BaseMenu.LinkItem
			{...itemProps}
			className={cx("glass-ui-menu__item", className)}
		>
			<span className="glass-ui-menu__text">{children}</span>
			{icon ? (
				<span className="glass-ui-menu__icon" aria-hidden="true">
					{icon}
				</span>
			) : null}
		</BaseMenu.LinkItem>
	);
}

export type MenuSubmenuRootProps = Omit<BaseMenu.SubmenuRoot.Props, "open"> & {
	open?: boolean;
};

function SubmenuRoot({
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	...rootProps
}: MenuSubmenuRootProps) {
	const [uncontrolled, setUncontrolled] = useState(defaultOpen);
	const open = openProp ?? uncontrolled;
	const trigger = useRef<HTMLElement | null>(null);
	const state = useMemo(() => ({ open, trigger }), [open]);
	return (
		<PopupState.Provider value={state}>
			<Handoff.Provider value={null}>
				<MenuPlacement.Provider value={BESIDE}>
					<BaseMenu.SubmenuRoot
						{...rootProps}
						open={open}
						onOpenChange={(next, eventDetails) => {
							if (openProp === undefined) setUncontrolled(next);
							onOpenChange?.(next, eventDetails);
						}}
					/>
				</MenuPlacement.Provider>
			</Handoff.Provider>
		</PopupState.Provider>
	);
}

function SubmenuTrigger({
	className,
	children,
	...triggerProps
}: Omit<BaseMenu.SubmenuTrigger.Props, "className"> & { className?: string }) {
	const { trigger } = usePopupState();
	return (
		<BaseMenu.SubmenuTrigger
			{...triggerProps}
			ref={(element: HTMLElement | null) => {
				trigger.current = element;
			}}
			className={cx("glass-ui-menu__item", className)}
		>
			<span className="glass-ui-menu__text">{children}</span>
			<span className="glass-ui-menu__icon" aria-hidden="true">
				<svg viewBox="0 0 16 16" aria-hidden="true">
					<path
						d="M6 3.5 10.5 8 6 12.5"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.8"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</span>
		</BaseMenu.SubmenuTrigger>
	);
}

function Separator({
	className,
	...separatorProps
}: Omit<BaseMenu.Separator.Props, "className"> & { className?: string }) {
	return (
		<BaseMenu.Separator
			{...separatorProps}
			className={cx("glass-ui-menu__separator", className)}
		/>
	);
}

function Group(props: BaseMenu.Group.Props) {
	return <BaseMenu.Group {...props} />;
}

function GroupLabel({
	className,
	...labelProps
}: Omit<BaseMenu.GroupLabel.Props, "className"> & { className?: string }) {
	return (
		<BaseMenu.GroupLabel
			{...labelProps}
			className={cx("glass-ui-menu__label", className)}
		/>
	);
}

export const Menu = {
	Root,
	Trigger,
	Popup,
	Item,
	LinkItem,
	CheckboxItem,
	RadioGroup,
	RadioItem,
	SubmenuRoot,
	SubmenuTrigger,
	Separator,
	Group,
	GroupLabel,
};

export const MenuRoot = Menu.Root;
export const MenuTrigger = Menu.Trigger;
export const MenuPopup = Menu.Popup;
export const MenuItem = Menu.Item;
export const MenuLinkItem = Menu.LinkItem;
export const MenuCheckboxItem = Menu.CheckboxItem;
export const MenuRadioGroup = Menu.RadioGroup;
export const MenuRadioItem = Menu.RadioItem;
export const MenuSubmenuRoot = Menu.SubmenuRoot;
export const MenuSubmenuTrigger = Menu.SubmenuTrigger;
export const MenuSeparator = Menu.Separator;
export const MenuGroup = Menu.Group;
export const MenuGroupLabel = Menu.GroupLabel;
