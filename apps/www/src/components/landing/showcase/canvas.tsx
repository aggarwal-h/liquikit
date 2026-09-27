import { GlassScope } from "@liquikit/react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

export function Canvas({
	title,
	text,
	parts,
	art,
	className = "",
	stageClassName = "",
	children,
}: {
	title: string;
	text: string;
	parts: string[];
	art: ReactNode;
	className?: string;
	stageClassName?: string;
	children: ReactNode;
}) {
	return (
		<motion.figure
			className={`min-w-0 ${className}`}
			initial={{ opacity: 0, y: 28 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-60px" }}
			transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
		>
			<GlassScope
				backdrop={art}
				className={`relative overflow-hidden rounded-[28px] bg-[#01030c] ring-1 ring-white/10 ${stageClassName}`}
			>
				<div className="h-full">{children}</div>
			</GlassScope>
			<figcaption className="mt-4 px-1">
				<p className="text-[16px] font-medium text-white">{title}</p>
				<p className="mt-1 max-w-[520px] text-[14px] leading-[1.5] text-white/50">
					{text}
				</p>
				<ul className="mt-3 flex flex-wrap gap-1.5">
					{parts.map((part) => (
						<li
							key={part}
							className="rounded-full bg-white/[0.06] px-2.5 py-1 font-mono text-[11.5px] text-white/60"
						>
							@liquikit/{part}
						</li>
					))}
				</ul>
			</figcaption>
		</motion.figure>
	);
}
