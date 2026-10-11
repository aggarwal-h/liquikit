// The lamp's light, worked out from its colour temperature the way a bulb is rated.

export const MIN_KELVIN = 2700;
export const MAX_KELVIN = 6500;

// Tanner Helland's fit to the black-body curve, good from 1000 K to 40000 K.
export function kelvinToRgb(kelvin: number): [number, number, number] {
	const t = kelvin / 100;
	const clamp = (value: number) =>
		Math.round(Math.min(255, Math.max(0, value)));
	const red = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -0.1332047592;
	const green =
		t <= 66
			? 99.4708025861 * Math.log(t) - 161.1195681661
			: 288.1221695283 * (t - 60) ** -0.0755148492;
	const blue =
		t >= 66
			? 255
			: t <= 19
				? 0
				: 138.5177312231 * Math.log(t - 10) - 305.0447927307;
	return [clamp(red), clamp(green), clamp(blue)];
}

// A diffuser washes the colour out towards white at its centre.
function towardsWhite([r, g, b]: [number, number, number], amount: number) {
	const mix = (channel: number) =>
		Math.round(channel + (255 - channel) * amount);
	return `rgb(${mix(r)} ${mix(g)} ${mix(b)})`;
}

// Bright light burns white at the centre; dim light keeps its colour.
function washFor(level: number) {
	return Math.min(1, Math.max(0, (level - 0.1) * 2));
}

export function lightVars(kelvin: number, level: number) {
	const rgb = kelvinToRgb(kelvin);
	const wash = washFor(level);
	return {
		"--edge": `rgb(${rgb.join(" ")})`,
		"--light": towardsWhite(rgb, 0.42 * wash),
		"--core": towardsWhite(rgb, 0.86 * wash),
		"--level": String(level),
		// The halo fades slower than the light, so a dim lamp still glows.
		"--glow": String(Math.max(level, Math.sqrt(level) * 0.8)),
	};
}

export type Scene = {
	value: string;
	label: string;
	level: number;
	kelvin: number;
	note: string;
};

export const SCENES: Scene[] = [
	{
		value: "sunrise",
		label: "Sunrise",
		level: 0.45,
		kelvin: 3200,
		note: "Brightens over 30 minutes before your alarm.",
	},
	{
		value: "focus",
		label: "Focus",
		level: 1,
		kelvin: 5600,
		note: "Cool, even light for reading and work.",
	},
	{
		value: "evening",
		label: "Evening",
		level: 0.62,
		kelvin: 2900,
		note: "Warm and low, the colour of a sunset.",
	},
	{
		value: "night",
		label: "Night",
		level: 0.12,
		kelvin: MIN_KELVIN,
		note: "Just enough to find your way.",
	},
];

export const FINISHES = [
	{
		value: "silver",
		label: "Silver",
		swatch: "#d9dade",
		metal:
			"conic-gradient(from 200deg, #f4f4f6, #a7a8ad, #e9e9ec, #8e8f94, #dcdce0, #f4f4f6)",
	},
	{
		value: "graphite",
		label: "Graphite",
		swatch: "#4a4a4f",
		metal:
			"conic-gradient(from 200deg, #6d6d73, #2b2b2f, #57575c, #1f1f22, #4a4a4f, #6d6d73)",
	},
	{
		value: "sand",
		label: "Sand",
		swatch: "#cdb594",
		metal:
			"conic-gradient(from 200deg, #efe0c8, #a8916f, #e2cfb2, #8f7a5c, #d6c2a2, #efe0c8)",
	},
] as const;

export type Finish = (typeof FINISHES)[number]["value"];

export function isFinish(value: string): value is Finish {
	return FINISHES.some((finish) => finish.value === value);
}

// A day of light: level and colour temperature by the hour.
const DAY: Array<[hour: number, level: number, kelvin: number]> = [
	[0, 0.1, 2700],
	[5, 0.1, 2700],
	[6.5, 0.42, 3000],
	[8, 0.7, 4000],
	[10, 0.9, 5600],
	[12, 1, 6500],
	[15, 0.95, 5800],
	[17.5, 0.7, 4000],
	[19, 0.6, 3100],
	[21, 0.45, 2800],
	[23, 0.18, 2700],
	[24, 0.1, 2700],
];

export function lightAtHour(hour: number) {
	const at = Math.min(24, Math.max(0, hour));
	const next = Math.max(
		1,
		DAY.findIndex(([h]) => h >= at),
	);
	const [h1, l1, k1] = DAY[next];
	const [h0, l0, k0] = DAY[next - 1];
	const t = h1 === h0 ? 1 : (at - h0) / (h1 - h0);
	const ease = t * t * (3 - 2 * t);
	return {
		level: l0 + (l1 - l0) * ease,
		kelvin: Math.round(k0 + (k1 - k0) * ease),
	};
}

// The day slider's track: the light each half hour, dimmed by its level.
export const DAY_TRACK = `linear-gradient(90deg, ${Array.from(
	{ length: 49 },
	(_, i) => {
		const hour = i / 2;
		const { level, kelvin } = lightAtHour(hour);
		const wash = 0.42 * washFor(level);
		const dim = 0.16 + 0.84 * level;
		const [r, g, b] = kelvinToRgb(kelvin).map((channel) =>
			Math.round((channel + (255 - channel) * wash) * dim),
		);
		return `rgb(${r} ${g} ${b}) ${((hour / 24) * 100).toFixed(2)}%`;
	},
).join(", ")})`;

export function formatHour(hour: number) {
	const minutes = Math.round(hour * 60) % 1440;
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
