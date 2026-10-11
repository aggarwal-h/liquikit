"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function Reveal({
	className,
	children,
}: {
	className?: string;
	children: ReactNode;
}) {
	const still = useReducedMotion();
	return (
		<motion.div
			className={className}
			initial={still ? false : { opacity: 0, y: 28 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-80px" }}
			transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
		>
			{children}
		</motion.div>
	);
}
