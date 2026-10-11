import type { CSSProperties } from "react";
import { FINISHES, type Finish, lightVars } from "./light";

// The lamp, drawn in CSS.
export function Lamp({
	kelvin,
	level,
	finish = "silver",
	size,
}: {
	kelvin: number;
	level: number;
	finish?: Finish;
	size: string;
}) {
	const metal =
		FINISHES.find((f) => f.value === finish)?.metal ?? FINISHES[0].metal;
	const off = level === 0;
	return (
		<div
			className="lamp"
			role="img"
			aria-label={
				off
					? `Lumen in ${finish}, switched off`
					: `Lumen in ${finish}, glowing at ${Math.round(level * 100)}% and ${kelvin} K`
			}
			data-off={off ? "" : undefined}
			style={
				{
					"--lamp-size": size,
					"--finish": metal,
					...lightVars(kelvin, level),
				} as CSSProperties
			}
		>
			<div className="lamp__shadow" />
			<div className="lamp__bloom" />
			<div className="lamp__ring" />
			<div className="lamp__disc">
				<div className="lamp__dim" />
				<div className="lamp__off" />
			</div>
			<div className="lamp__sheen" />
		</div>
	);
}
