"use client";

import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import type { ReactNode } from "react";
import { Button, type ButtonProps } from "./button";
import { GlassPane, type GlassRefraction } from "./glass";
import { cx, type GlassOptions } from "./types";
import "./liquikit.css";

type Classed<P> = Omit<P, "className"> & { className?: string };

function Chevron() {
	return (
		<svg className="glass-ui-chevron" viewBox="0 0 16 16" aria-hidden="true">
			<path d="M6 3.5 10.5 8 6 12.5" />
		</svg>
	);
}

export type AccordionRootProps = Classed<BaseAccordion.Root.Props> &
	GlassOptions & {
		refraction?: GlassRefraction;
	};

function Root({
	className,
	theme,
	lens,
	liquid,
	refraction,
	...props
}: AccordionRootProps) {
	return (
		<BaseAccordion.Root
			{...props}
			className={cx("glass-ui-accordion", className)}
			render={(rootProps) => (
				<GlassPane
					{...rootProps}
					radius={22}
					theme={theme}
					lens={lens}
					liquid={liquid}
					refraction={refraction}
				/>
			)}
		/>
	);
}

function Item({ className, ...props }: Classed<BaseAccordion.Item.Props>) {
	return (
		<BaseAccordion.Item
			{...props}
			className={cx("glass-ui-accordion__item", className)}
		/>
	);
}

function Trigger({
	className,
	children,
	...props
}: Classed<BaseAccordion.Trigger.Props> & { children?: ReactNode }) {
	return (
		<BaseAccordion.Header className="glass-ui-accordion__header">
			<BaseAccordion.Trigger
				{...props}
				className={cx("glass-ui-accordion__trigger", className)}
			>
				<span className="glass-ui-accordion__title">{children}</span>
				<Chevron />
			</BaseAccordion.Trigger>
		</BaseAccordion.Header>
	);
}

function Panel({
	className,
	children,
	...props
}: Classed<BaseAccordion.Panel.Props> & { children?: ReactNode }) {
	return (
		<BaseAccordion.Panel
			{...props}
			className={cx("glass-ui-disclosure", className)}
		>
			<div className="glass-ui-accordion__body">{children}</div>
		</BaseAccordion.Panel>
	);
}

export const Accordion = { Root, Item, Trigger, Panel };

export function CollapsibleRoot({
	className,
	...props
}: Classed<BaseCollapsible.Root.Props>) {
	return (
		<BaseCollapsible.Root
			{...props}
			className={cx("glass-ui-collapsible", className)}
		/>
	);
}

export function CollapsibleTrigger({ children, ...props }: ButtonProps) {
	return (
		<BaseCollapsible.Trigger
			render={
				<Button {...props}>
					{children}
					<Chevron />
				</Button>
			}
		/>
	);
}

export function CollapsiblePanel({
	className,
	children,
	...props
}: Classed<BaseCollapsible.Panel.Props> & { children?: ReactNode }) {
	return (
		<BaseCollapsible.Panel
			{...props}
			className={cx("glass-ui-disclosure", className)}
		>
			<div className="glass-ui-collapsible__body">{children}</div>
		</BaseCollapsible.Panel>
	);
}

export const Collapsible = {
	Root: CollapsibleRoot,
	Trigger: CollapsibleTrigger,
	Panel: CollapsiblePanel,
};

export const AccordionRoot = Accordion.Root;
export const AccordionItem = Accordion.Item;
export const AccordionTrigger = Accordion.Trigger;
export const AccordionPanel = Accordion.Panel;
