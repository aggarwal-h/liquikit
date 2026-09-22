"use client";

import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import type { CSSProperties, ReactNode } from "react";
import { GlassPane, type GlassRefraction } from "./glass";
import { cx, type GlassOptions } from "./types";
import "./liquikit.css";

export type AvatarProps = GlassOptions & {
	src?: string;
	alt?: string;
	fallback?: ReactNode;
	size?: number;
	refraction?: GlassRefraction;
	className?: string;
	style?: CSSProperties;
};

export function Avatar({
	src,
	alt = "",
	fallback,
	size = 40,
	theme,
	lens,
	liquid,
	refraction,
	className,
	style,
}: AvatarProps) {
	return (
		<BaseAvatar.Root
			className={cx("glass-ui-avatar", className)}
			style={{ ...style, "--avatar-size": `${size}px` } as CSSProperties}
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
			<span className="glass-ui-avatar__disc">
				{src ? (
					<BaseAvatar.Image
						src={src}
						alt={alt}
						className="glass-ui-avatar__image"
					/>
				) : null}
				<BaseAvatar.Fallback className="glass-ui-avatar__fallback">
					{fallback}
				</BaseAvatar.Fallback>
			</span>
		</BaseAvatar.Root>
	);
}
