"use client";

import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import type { CSSProperties, ReactNode } from "react";
import { Button, type ButtonProps } from "./button";
import type { GlassRefraction } from "./glass";
import type { GlassOptions } from "./types";

export type ToggleProps = Omit<
	BaseToggle.Props,
	"className" | "style" | "render"
> &
	GlassOptions &
	Pick<ButtonProps, "size" | "icon" | "tint"> & {
		variant?: "glass" | "clear";
		refraction?: GlassRefraction;
		className?: string;
		style?: CSSProperties;
		children?: ReactNode;
	};

export function Toggle({
	variant = "glass",
	size,
	icon,
	tint,
	theme,
	lens,
	liquid,
	refraction,
	className,
	style,
	children,
	...toggleProps
}: ToggleProps) {
	return (
		<BaseToggle
			{...toggleProps}
			render={(props, state) => (
				<Button
					{...(props as ButtonProps)}
					variant={state.pressed ? "prominent" : variant}
					size={size}
					icon={icon}
					tint={tint}
					theme={theme}
					lens={lens}
					liquid={liquid}
					refraction={refraction}
					className={className}
					style={style}
				>
					{children}
				</Button>
			)}
		/>
	);
}
