"use client";

import { NavigationMenu as BaseNavigationMenu } from "@base-ui/react/navigation-menu";
import {
	type CSSProperties,
	type ReactNode,
	useMemo,
	useRef,
	useState,
} from "react";
import { GlassPane, type GlassRefraction, type GlassTheme } from "./glass";
import { MorphPane, PopupState, usePopupState } from "./popup";
import { cx, type GlassOptions } from "./types";
import "./liquikit.css";

type Classed<P> = Omit<P, "className"> & { className?: string };

export type NavigationMenuRootProps = Omit<
	BaseNavigationMenu.Root.Props,
	"className"
> & {
	theme?: GlassTheme;
	refraction?: GlassRefraction;
	className?: string;
};

function Root({
	theme,
	refraction,
	className,
	children,
	value: valueProp,
	defaultValue = null,
	onValueChange,
	...rootProps
}: NavigationMenuRootProps) {
	const [uncontrolled, setUncontrolled] = useState(defaultValue);
	const value = valueProp === undefined ? uncontrolled : valueProp;
	const open = value !== null && value !== undefined;
	const trigger = useRef<HTMLElement | null>(null);
	const state = useMemo(() => ({ open, trigger }), [open]);
	return (
		<PopupState.Provider value={state}>
			<BaseNavigationMenu.Root
				{...rootProps}
				value={value}
				onValueChange={(next, eventDetails) => {
					if (valueProp === undefined) setUncontrolled(next);
					onValueChange?.(next, eventDetails);
				}}
				className={cx("glass-ui-nav", className)}
			>
				{children}
				<BaseNavigationMenu.Portal>
					<BaseNavigationMenu.Positioner
						className="glass-ui-positioner glass-ui-nav__positioner"
						sideOffset={10}
						collisionPadding={16}
						collisionAvoidance={{ side: "none" }}
					>
						<BaseNavigationMenu.Popup
							className="glass-ui-popup glass-ui-nav__popup"
							render={(props) => (
								<MorphPane {...props} theme={theme} refraction={refraction} />
							)}
						>
							<BaseNavigationMenu.Viewport className="glass-ui-nav__viewport" />
						</BaseNavigationMenu.Popup>
					</BaseNavigationMenu.Positioner>
				</BaseNavigationMenu.Portal>
			</BaseNavigationMenu.Root>
		</PopupState.Provider>
	);
}

export type NavigationMenuListProps = Classed<BaseNavigationMenu.List.Props> &
	GlassOptions & {
		refraction?: GlassRefraction;
		style?: CSSProperties;
	};

function List({
	className,
	theme,
	lens,
	liquid,
	refraction,
	children,
	...listProps
}: NavigationMenuListProps & { children?: ReactNode }) {
	return (
		<BaseNavigationMenu.List
			{...listProps}
			className={cx("glass-ui-nav__list", className)}
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
			<ul className="glass-ui-nav__row">{children}</ul>
		</BaseNavigationMenu.List>
	);
}

function Item(props: BaseNavigationMenu.Item.Props) {
	return <BaseNavigationMenu.Item {...props} />;
}

function Trigger({
	className,
	children,
	onPointerEnter,
	onFocus,
	onClick,
	...triggerProps
}: Classed<BaseNavigationMenu.Trigger.Props> & { children?: ReactNode }) {
	const { trigger } = usePopupState();
	const mark = (element: EventTarget) => {
		trigger.current = element as HTMLElement;
	};
	return (
		<BaseNavigationMenu.Trigger
			{...triggerProps}
			className={cx(
				"glass-ui-toolbar__button glass-ui-nav__trigger",
				className,
			)}
			onPointerEnter={(event) => {
				mark(event.currentTarget);
				onPointerEnter?.(event);
			}}
			onFocus={(event) => {
				mark(event.currentTarget);
				onFocus?.(event);
			}}
			onClick={(event) => {
				mark(event.currentTarget);
				onClick?.(event);
			}}
		>
			{children}
			<BaseNavigationMenu.Icon className="glass-ui-nav__icon">
				<svg viewBox="0 0 16 16" aria-hidden="true">
					<path d="M4 6l4 4 4-4" />
				</svg>
			</BaseNavigationMenu.Icon>
		</BaseNavigationMenu.Trigger>
	);
}

function Content({
	className,
	...contentProps
}: Classed<BaseNavigationMenu.Content.Props>) {
	return (
		<BaseNavigationMenu.Content
			{...contentProps}
			className={cx("glass-ui-nav__content", className)}
		/>
	);
}

function Link({
	className,
	title,
	description,
	children,
	...linkProps
}: Classed<BaseNavigationMenu.Link.Props> & {
	title?: ReactNode;
	description?: ReactNode;
	children?: ReactNode;
}) {
	if (title) {
		return (
			<BaseNavigationMenu.Link
				{...linkProps}
				className={cx("glass-ui-nav__card", className)}
			>
				<span className="glass-ui-nav__card-title">{title}</span>
				{description ? (
					<span className="glass-ui-nav__card-description">{description}</span>
				) : null}
			</BaseNavigationMenu.Link>
		);
	}
	return (
		<BaseNavigationMenu.Link
			{...linkProps}
			className={cx("glass-ui-toolbar__button", className)}
		>
			{children}
		</BaseNavigationMenu.Link>
	);
}

export const NavigationMenu = { Root, List, Item, Trigger, Content, Link };

export const NavigationMenuRoot = NavigationMenu.Root;
export const NavigationMenuList = NavigationMenu.List;
export const NavigationMenuItem = NavigationMenu.Item;
export const NavigationMenuTrigger = NavigationMenu.Trigger;
export const NavigationMenuContent = NavigationMenu.Content;
export const NavigationMenuLink = NavigationMenu.Link;
