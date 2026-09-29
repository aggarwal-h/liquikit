import { GlassScope } from "@liquikit/react";
import type { ReactNode } from "react";

function Backdrop() {
	return (
		<>
			<div
				className="absolute inset-0"
				style={{
					backgroundImage: [
						"radial-gradient(70% 90% at 50% 115%, color-mix(in oklab, var(--neon) 85%, transparent) 0%, transparent 62%)",
						"radial-gradient(45% 60% at 8% -10%, color-mix(in oklab, var(--neon) 45%, transparent) 0%, transparent 70%)",
						"linear-gradient(to right, rgb(255 255 255 / 0.07) 1px, transparent 1px)",
						"linear-gradient(to bottom, rgb(255 255 255 / 0.07) 1px, transparent 1px)",
					].join(","),
					backgroundSize: "100% 100%, 100% 100%, 28px 28px, 28px 28px",
					backgroundPosition: "center, center, center, center",
				}}
			/>
			<div className="absolute top-1/2 left-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
			<div className="absolute top-1/2 left-1/2 size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" />
		</>
	);
}

export function Stage({
	align = "center",
	className = "",
	children,
}: {
	align?: "center" | "start";
	className?: string;
	children: ReactNode;
}) {
	return (
		<GlassScope
			backdrop={<Backdrop />}
			className={`relative overflow-hidden bg-[#02040f] ${className}`}
		>
			<div
				className={`flex min-h-[340px] w-full justify-center p-8 sm:p-10 ${align === "center" ? "items-center" : "items-start"}`}
			>
				{children}
			</div>
		</GlassScope>
	);
}
