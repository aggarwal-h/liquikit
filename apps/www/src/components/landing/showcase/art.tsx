import { useId } from "react";

function random(seed: number) {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function range(count: number) {
	return Array.from({ length: count }, (_, i) => i);
}

function useIds(...names: string[]) {
	const id = useId().replaceAll(":", "");
	return Object.fromEntries(names.map((name) => [name, `${id}-${name}`]));
}

export function CoverArt() {
	const ids = useIds("sky", "disc", "haze", "blur", "type");
	return (
		<svg
			aria-hidden="true"
			className="size-full"
			viewBox="0 0 720 540"
			preserveAspectRatio="xMinYMid slice"
		>
			<defs>
				<radialGradient id={ids.sky} cx="0.72" cy="0.18" r="0.95">
					<stop offset="0" stopColor="#1d4dff" />
					<stop offset="0.45" stopColor="#071552" />
					<stop offset="1" stopColor="#01030c" />
				</radialGradient>
				<linearGradient id={ids.disc} x1="0.2" y1="0" x2="0.8" y2="1">
					<stop offset="0" stopColor="#c9f3ff" />
					<stop offset="0.35" stopColor="#58b6ff" />
					<stop offset="0.75" stopColor="#2160ff" />
					<stop offset="1" stopColor="#1b1f9e" />
				</linearGradient>
				<linearGradient id={ids.type} x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor="#ffffff" />
					<stop offset="1" stopColor="#9fc2ff" />
				</linearGradient>
				<filter id={ids.blur} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="46" />
				</filter>
			</defs>
			<rect width="720" height="540" fill={`url(#${ids.sky})`} />
			<circle
				cx="170"
				cy="470"
				r="170"
				fill="#2160ff"
				opacity="0.55"
				filter={`url(#${ids.blur})`}
			/>
			{[232, 268, 306, 348].map((r, i) => (
				<circle
					key={r}
					cx="520"
					cy="150"
					r={r}
					fill="none"
					stroke="#bcd6ff"
					strokeOpacity={0.34 - i * 0.07}
					strokeWidth="1.5"
				/>
			))}
			<circle cx="520" cy="150" r="196" fill={`url(#${ids.disc})`} />
			<g fill="#01030c" opacity="0.9">
				{[0, 1, 2, 3, 4, 5].map((i) => (
					<rect
						key={`k${i}`}
						x="300"
						y={236 + i * 22 + i * i * 1.5}
						width="460"
						height={3 + i * 2.2}
					/>
				))}
			</g>
			<text
				x="34"
				y="210"
				fill={`url(#${ids.type})`}
				fontSize="148"
				fontWeight="800"
				letterSpacing="-9"
				fontFamily="Geist Variable, sans-serif"
			>
				AFTER
			</text>
			<text
				x="34"
				y="338"
				fill="none"
				stroke="#ffffff"
				strokeWidth="2.5"
				fontSize="148"
				fontWeight="800"
				letterSpacing="-9"
				fontFamily="Geist Variable, sans-serif"
			>
				GLOW
			</text>
			<g fill="#ffffff" opacity="0.55">
				{range(9).map((i) => (
					<circle key={`dot${i}`} cx={46 + i * 22} cy="378" r="2.5" />
				))}
			</g>
		</svg>
	);
}

export function MiniCover({ className = "" }: { className?: string }) {
	const ids = useIds("sky", "disc");
	return (
		<svg viewBox="0 0 60 60" className={className} aria-hidden="true">
			<defs>
				<radialGradient id={ids.sky} cx="0.7" cy="0.2" r="1">
					<stop offset="0" stopColor="#1d4dff" />
					<stop offset="1" stopColor="#020824" />
				</radialGradient>
				<linearGradient id={ids.disc} x1="0.2" y1="0" x2="0.8" y2="1">
					<stop offset="0" stopColor="#c9f3ff" />
					<stop offset="0.5" stopColor="#4a9dff" />
					<stop offset="1" stopColor="#1b1f9e" />
				</linearGradient>
			</defs>
			<rect width="60" height="60" fill={`url(#${ids.sky})`} />
			<circle cx="40" cy="20" r="17" fill={`url(#${ids.disc})`} />
			<text
				x="5"
				y="44"
				fill="#fff"
				fontSize="15"
				fontWeight="800"
				letterSpacing="-1"
				fontFamily="Geist Variable, sans-serif"
			>
				AFTER
			</text>
		</svg>
	);
}

export function Horizon() {
	const ids = useIds("sky", "sun", "stripes", "floor", "glow");
	const cx = 260;
	const horizon = 356;
	return (
		<svg
			aria-hidden="true"
			className="size-full"
			viewBox="0 0 520 540"
			preserveAspectRatio="xMidYMid slice"
		>
			<defs>
				<linearGradient id={ids.sky} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#01030c" />
					<stop offset="0.45" stopColor="#050f3f" />
					<stop offset="0.66" stopColor="#1a44d6" />
					<stop offset="0.66" stopColor="#020617" />
					<stop offset="1" stopColor="#01030c" />
				</linearGradient>
				<linearGradient id={ids.sun} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#e8f8ff" />
					<stop offset="0.45" stopColor="#6fb7ff" />
					<stop offset="1" stopColor="#2160ff" />
				</linearGradient>
				<mask id={ids.stripes}>
					<rect width="520" height="540" fill="#fff" />
					{range(7).map((i) => (
						<rect
							key={`k${i}`}
							x="0"
							y={250 + i * 16 + i * i * 0.6}
							width="520"
							height={2 + i * 1.6}
							fill="#000"
						/>
					))}
				</mask>
				<filter id={ids.glow} x="-60%" y="-60%" width="220%" height="220%">
					<feGaussianBlur stdDeviation="30" />
				</filter>
			</defs>
			<rect width="520" height="540" fill={`url(#${ids.sky})`} />
			{range(40).map((i) => {
				const next = random(7 + i);
				return (
					<circle
						key={`k${i}`}
						cx={next() * 520}
						cy={next() * 220}
						r={next() * 1.1 + 0.3}
						fill="#cfe0ff"
						opacity={next() * 0.6 + 0.2}
					/>
				);
			})}
			<circle
				cx={cx}
				cy={horizon - 40}
				r="150"
				fill="#2160ff"
				opacity="0.7"
				filter={`url(#${ids.glow})`}
			/>
			<g mask={`url(#${ids.stripes})`}>
				<circle cx={cx} cy={horizon - 30} r="128" fill={`url(#${ids.sun})`} />
			</g>
			<rect
				x="0"
				y={horizon}
				width="520"
				height={540 - horizon}
				fill="#020617"
			/>
			<g stroke="#3d7bff" strokeWidth="1.2">
				{range(9).map((i) => {
					const y = horizon + 4 + (i * i + i) * 2.8;
					return (
						<line
							key={`h${i}`}
							x1="0"
							x2="520"
							y1={y}
							y2={y}
							strokeOpacity={0.25 + i * 0.07}
						/>
					);
				})}
				{range(17).map((i) => {
					const spread = (i - 8) * 70;
					return (
						<line
							key={`v${i}`}
							x1={cx + spread * 0.08}
							y1={horizon}
							x2={cx + spread * 1.6}
							y2="540"
							strokeOpacity="0.55"
						/>
					);
				})}
			</g>
			<rect
				x="0"
				y={horizon - 1}
				width="520"
				height="2"
				fill="#9cc4ff"
				opacity="0.8"
			/>
		</svg>
	);
}

const PHOTOS: Array<[string, string, number]> = [
	["#0b2cff", "#6fe3ff", 0],
	["#1a0f5c", "#8a6bff", 1],
	["#02184a", "#29a3ff", 2],
	["#2a0b5e", "#ff5fb0", 3],
	["#01323f", "#2ee6c5", 1],
	["#071a4a", "#9ec5ff", 0],
	["#120a3d", "#5b7cff", 2],
	["#03122e", "#35d0ff", 3],
	["#1b0d4d", "#c07bff", 0],
	["#001d4f", "#4f8dff", 3],
	["#0a2340", "#7cf2ff", 2],
	["#20094a", "#ff7ac6", 1],
	["#021437", "#3f6bff", 1],
	["#012a3a", "#40e0d0", 0],
	["#0d0b45", "#7d8bff", 2],
];

function Photo({ from, to, kind }: { from: string; to: string; kind: number }) {
	const ids = useIds("bg", "fg");
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 100 100"
			preserveAspectRatio="xMidYMid slice"
			className="size-full"
		>
			<defs>
				<linearGradient id={ids.bg} x1="0" y1="0" x2="0.4" y2="1">
					<stop offset="0" stopColor={to} stopOpacity="0.85" />
					<stop offset="1" stopColor={from} />
				</linearGradient>
				<linearGradient id={ids.fg} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#ffffff" />
					<stop offset="1" stopColor={to} />
				</linearGradient>
			</defs>
			<rect width="100" height="100" fill={`url(#${ids.bg})`} />
			{kind === 0 ? (
				<>
					<circle cx="66" cy="34" r="16" fill={`url(#${ids.fg})`} />
					<path d="M0 78 L30 50 L52 70 L72 54 L100 80 V100 H0Z" fill={from} />
				</>
			) : kind === 1 ? (
				<>
					<circle
						cx="50"
						cy="50"
						r="30"
						fill="none"
						stroke="#fff"
						strokeOpacity="0.8"
						strokeWidth="3"
					/>
					<circle cx="50" cy="50" r="14" fill={`url(#${ids.fg})`} />
				</>
			) : kind === 2 ? (
				<g fill="#fff" fillOpacity="0.75">
					{[0, 1, 2, 3, 4].map((i) => (
						<rect
							key={`k${i}`}
							x="0"
							y={20 + i * 14}
							width="100"
							height={3 + i}
						/>
					))}
				</g>
			) : (
				<path
					d="M-10 70 C20 40 40 90 70 55 S110 40 110 40 V110 H-10Z"
					fill={`url(#${ids.fg})`}
					opacity="0.8"
				/>
			)}
		</svg>
	);
}

export function PhotoGrid({ className = "" }: { className?: string }) {
	return (
		<div className={`grid grid-cols-3 gap-[3px] ${className}`}>
			{PHOTOS.map(([from, to, kind], i) => (
				<div key={`${from}${to}`} className="aspect-square overflow-hidden">
					<Photo from={from} to={to} kind={(kind + i) % 4} />
				</div>
			))}
		</div>
	);
}

export function Waves() {
	const ids = useIds("sky", "a", "b", "c");
	const band = (y: number, amp: number, phase: number) => {
		let d = `M0 ${y}`;
		for (let x = 0; x <= 420; x += 30) {
			d += ` L${x} ${y + Math.sin(x / 70 + phase) * amp}`;
		}
		return `${d} L420 480 L0 480Z`;
	};
	return (
		<svg
			aria-hidden="true"
			className="size-full"
			viewBox="0 0 420 480"
			preserveAspectRatio="xMidYMid slice"
		>
			<defs>
				<linearGradient id={ids.sky} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#040b33" />
					<stop offset="0.6" stopColor="#1638c9" />
					<stop offset="1" stopColor="#6cc6ff" />
				</linearGradient>
				<linearGradient id={ids.a} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#2f6bff" />
					<stop offset="1" stopColor="#0a1a6e" />
				</linearGradient>
				<linearGradient id={ids.b} x1="1" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#8fd8ff" />
					<stop offset="1" stopColor="#2160ff" />
				</linearGradient>
				<linearGradient id={ids.c} x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor="#050f45" />
					<stop offset="1" stopColor="#12298f" />
				</linearGradient>
			</defs>
			<rect width="420" height="480" fill={`url(#${ids.sky})`} />
			<path d={band(250, 26, 0)} fill={`url(#${ids.a})`} />
			<path
				d={band(300, 30, 2)}
				fill={`url(#${ids.b})`}
				stroke="#e6f4ff"
				strokeOpacity="0.7"
				strokeWidth="1.5"
			/>
			<path d={band(350, 22, 4)} fill={`url(#${ids.c})`} />
			<path
				d={band(410, 18, 1)}
				fill="#01030c"
				stroke="#6ea8ff"
				strokeOpacity="0.5"
			/>
		</svg>
	);
}

export function CityMap() {
	const ids = useIds("glow", "water");
	const next = random(42);
	const streets: string[] = [];
	for (let i = 0; i < 16; i++) {
		const y = i * 38 - 40 + next() * 12;
		streets.push(`M-40 ${y} L460 ${y + 70}`);
	}
	for (let i = 0; i < 14; i++) {
		const x = i * 40 - 60 + next() * 14;
		streets.push(`M${x} -40 L${x - 60} 520`);
	}
	return (
		<svg
			aria-hidden="true"
			className="size-full"
			viewBox="0 0 420 480"
			preserveAspectRatio="xMidYMid slice"
		>
			<defs>
				<filter id={ids.glow} x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="5" />
				</filter>
				<linearGradient id={ids.water} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#0b3bd6" />
					<stop offset="1" stopColor="#2f86ff" />
				</linearGradient>
			</defs>
			<rect width="420" height="480" fill="#030a24" />
			<path d="M250 60 L330 80 L320 150 L240 130Z" fill="#06205a" />
			<path d="M40 330 L130 350 L118 420 L30 400Z" fill="#06205a" />
			<g stroke="#15317f" strokeWidth="5" strokeLinecap="round">
				{streets.map((d) => (
					<path key={d} d={d} />
				))}
			</g>
			<g stroke="#2a56c6" strokeWidth="9" strokeLinecap="round">
				<path d="M-40 250 L460 322" />
				<path d="M190 -40 L120 520" />
			</g>
			<path
				d="M-20 150 C80 170 120 120 200 190 S330 260 440 230 L440 290 C330 320 260 250 190 245 S60 210 -20 215Z"
				fill={`url(#${ids.water})`}
				stroke="#8cc4ff"
				strokeOpacity="0.6"
			/>
			<path
				d="M72 402 L96 318 L156 330 L182 262 L268 276 L300 176 L352 186"
				fill="none"
				stroke="#6fe0ff"
				strokeWidth="12"
				strokeLinejoin="round"
				strokeLinecap="round"
				filter={`url(#${ids.glow})`}
			/>
			<path
				d="M72 402 L96 318 L156 330 L182 262 L268 276 L300 176 L352 186"
				fill="none"
				stroke="#e8fbff"
				strokeWidth="4"
				strokeLinejoin="round"
				strokeLinecap="round"
			/>
			<circle
				cx="72"
				cy="402"
				r="9"
				fill="#fff"
				stroke="#2160ff"
				strokeWidth="5"
			/>
			<path
				d="M352 186 c-12 -14 -14 -22 -14 -28 a14 14 0 0 1 28 0 c0 6 -2 14 -14 28z"
				fill="#ff4f9a"
				stroke="#fff"
				strokeWidth="2.5"
			/>
			<circle cx="352" cy="158" r="5" fill="#fff" />
		</svg>
	);
}
