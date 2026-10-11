"use client";

import { type CSSProperties, useState } from "react";
import { GlassScope } from "@/components/liquikit/glass";
import { Slider } from "@/components/liquikit/slider";
import { Heading } from "./heading";
import { Lamp } from "./lamp";
import { DAY_TRACK, formatHour, lightAtHour } from "./light";
import { Reveal } from "./reveal";
import { Stage } from "./stage";
import { useLumen } from "./state";

const HOURS = ["Midnight", "6 AM", "Noon", "6 PM", "Midnight"];

export function FollowTheSun() {
	const [minutes, setMinutes] = useState(7 * 60 + 30);
	const { finish } = useLumen();
	const hour = minutes / 60;
	const { level, kelvin } = lightAtHour(hour);

	return (
		<section id="light" className="scroll-mt-20 pt-28">
			<Reveal>
				<Heading title="Light, by the hour.">
					Cool and bright in the morning, warm and low by evening. Lumen follows
					the sun through the day, so the light always fits the hour. Drag
					through a day to see it.
				</Heading>
			</Reveal>
			<Reveal>
				<Stage
					className="mt-12 max-w-[960px] [--lamp:min(380px,66vw)]"
					layout="flex flex-col items-center pt-[calc(var(--lamp)*0.34)] pb-10"
				>
					<Lamp
						kelvin={kelvin}
						level={level}
						finish={finish}
						size="var(--lamp)"
					/>
					<div className="relative z-10 mt-[calc(var(--lamp)*0.1)] w-full max-w-[560px] px-6">
						<div className="flex items-baseline justify-between">
							<p className="text-[28px] font-semibold tracking-[-0.02em] tabular-nums">
								{formatHour(hour)}
							</p>
							<p className="text-[15px] text-(--muted) tabular-nums">
								{kelvin} K · {Math.round(level * 100)}%
							</p>
						</div>
						<GlassScope
							className="day mt-4"
							style={{ "--day-track": DAY_TRACK } as CSSProperties}
						>
							<Slider
								value={minutes}
								onValueChange={setMinutes}
								min={0}
								max={1440}
								step={10}
								trackHeight={10}
								thumbHeight={26}
								aria-label="Time of day"
							/>
							<div className="mt-3 flex justify-between text-[11px] text-(--muted) sm:text-[12px]">
								{HOURS.map((label, index) => (
									<span key={`${label}-${index === 0 ? "start" : "end"}`}>
										{label}
									</span>
								))}
							</div>
						</GlassScope>
					</div>
				</Stage>
			</Reveal>
		</section>
	);
}
