import {
	motion,
	useReducedMotion,
	useScroll,
	useTransform,
} from "motion/react";
import { useRef, useState } from "react";
import { GlassSymbols } from "./glass-symbols";
import { MARK_PATH } from "./mark";

function span(value: number, from: number, to: number, a: number, b: number) {
	const k = Math.min(1, Math.max(0, (value - from) / (to - from)));
	return a + (b - a) * k;
}

export function Hero() {
	const track = useRef<HTMLElement>(null);
	const logo = useRef<HTMLDivElement>(null);
	const [glass, setGlass] = useState(false);
	const still = useReducedMotion() ?? false;
	const { scrollYProgress } = useScroll({
		target: track,
		offset: ["start start", "end end"],
	});
	const travel = useTransform(scrollYProgress, (value) => (still ? 0 : value));
	const words = useTransform(travel, (value) => span(value, 0, 0.22, 1, 0));
	const drift = useTransform(travel, (value) => span(value, 0, 0.3, 0, -80));
	const fade = useTransform(travel, (value) => span(value, 0.82, 1, 0, 1));

	return (
		<section
			ref={track}
			className={`relative bg-black text-white ${still ? "h-svh" : "h-[210svh]"}`}
		>
			<div className="sticky top-0 flex h-svh min-h-[560px] flex-col items-center overflow-hidden">
				<GlassSymbols
					progress={travel}
					logo={logo}
					onReady={() => setGlass(true)}
				/>
				<motion.div
					className="relative flex flex-col items-center"
					style={{ opacity: words, y: drift }}
				>
					<p className="mt-[8svh] flex items-center gap-[0.36em] text-[clamp(22px,min(4.6svh,5.6vw),46px)] font-semibold tracking-[-0.02em]">
						<span ref={logo} className="size-[1.3em]">
							<svg
								viewBox="0 0 96 96"
								aria-hidden="true"
								className={`size-full transition-opacity duration-500 ${glass ? "opacity-0" : ""}`}
							>
								<path d={MARK_PATH} fill="currentColor" fillRule="evenodd" />
							</svg>
						</span>
						LiquiKit
					</p>
					<h1 className="mt-[4.2svh] px-6 text-center text-[clamp(34px,min(8.4svh,7.4vw),96px)] leading-[1.1] font-semibold tracking-[-0.035em]">
						Liquid glass components
						<br />
						with physically based refraction
					</h1>
				</motion.div>
				<motion.div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 bg-black"
					style={{ opacity: fade }}
				/>
			</div>
		</section>
	);
}
