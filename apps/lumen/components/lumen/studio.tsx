"use client";

import { Lightbulb, Sun, SunDim } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { GlassPane } from "@/components/liquikit/glass";
import { SegmentedControl } from "@/components/liquikit/segmented-control";
import { Slider } from "@/components/liquikit/slider";
import { Switch } from "@/components/liquikit/switch";
import { Heading } from "./heading";
import { Lamp } from "./lamp";
import { lightAtHour, MAX_KELVIN, MIN_KELVIN, SCENES } from "./light";
import { Reveal } from "./reveal";
import { Stage } from "./stage";
import { useLumen } from "./state";

function clock(date: Date) {
	return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function Studio() {
	const { light, finish, setOn, setLevel, setKelvin, chooseScene } = useLumen();
	const [followSun, setFollowSun] = useState(false);
	const [now, setNow] = useState<Date | null>(null);

	// Following the sun sets the colour from the time of day, and keeps it there.
	useEffect(() => {
		if (!followSun) return;
		const update = () => {
			const date = new Date();
			setNow(date);
			setKelvin(lightAtHour(date.getHours() + date.getMinutes() / 60).kelvin);
		};
		update();
		const timer = window.setInterval(update, 60_000);
		return () => window.clearInterval(timer);
	}, [followSun, setKelvin]);

	const { on, level, kelvin, scene } = light;
	const note = SCENES.find((s) => s.value === scene)?.note;

	return (
		<section id="control" className="scroll-mt-20 pt-28">
			<Reveal>
				<Heading title="Every light you want.">
					Any brightness, and any white from candlelight to midday. Set a scene,
					or dial it in yourself.
				</Heading>
			</Reveal>
			<Reveal>
				<Stage
					scope
					className="mt-12 max-w-[1100px] [--lamp:min(400px,72vw)]"
					layout="grid grid-cols-1 items-center justify-items-center gap-8 px-6 pt-[calc(var(--lamp)*0.34)] pb-8 lg:grid-cols-[1fr_400px] lg:gap-6 lg:py-[calc(var(--lamp)*0.34)] lg:pr-14 lg:pl-20"
				>
					<Lamp
						kelvin={kelvin}
						level={on ? level : 0}
						finish={finish}
						size="var(--lamp)"
					/>
					<GlassPane radius={34} className="w-full max-w-[400px]">
						<div className="flex flex-col gap-6 p-6">
							<div className="flex items-center gap-3">
								<span className="grid size-10 place-items-center rounded-full bg-white/10">
									<Lightbulb className="size-5" />
								</span>
								<div className="min-w-0 flex-1">
									<p className="text-[17px] leading-tight font-semibold">
										Lumen
									</p>
									<p className="text-[13px] text-(--muted)">
										Living room · {on ? `${Math.round(level * 100)}%` : "Off"}
									</p>
								</div>
								<Switch
									checked={on}
									onCheckedChange={setOn}
									aria-label="Power"
								/>
							</div>

							<div className="flex flex-col gap-3">
								<SegmentedControl
									options={SCENES.map(({ value, label }) => ({ value, label }))}
									value={scene}
									onValueChange={(value) => {
										chooseScene(value);
										setFollowSun(false);
									}}
									aria-label="Scene"
								/>
								<p className="min-h-[2.6em] text-[13px] leading-snug text-(--muted)">
									{note}
								</p>
							</div>

							<Control label="Brightness" value={`${Math.round(level * 100)}%`}>
								<SunDim className="size-4 shrink-0 text-(--muted)" />
								<div className="min-w-0 flex-1">
									<Slider
										value={Math.round(level * 100)}
										onValueChange={(value) => setLevel(value / 100)}
										min={1}
										max={100}
										aria-label="Brightness"
									/>
								</div>
								<Sun className="size-[18px] shrink-0 text-(--muted)" />
							</Control>

							<Control label="Colour temperature" value={`${kelvin} K`}>
								<span className="text-[12px] text-[#ffb46b]">Warm</span>
								<div className="kelvin min-w-0 flex-1">
									<Slider
										value={kelvin}
										onValueChange={(value) => {
											setKelvin(value);
											setFollowSun(false);
										}}
										min={MIN_KELVIN}
										max={MAX_KELVIN}
										step={100}
										aria-label="Colour temperature"
									/>
								</div>
								<span className="text-[12px] text-[#bcd7ff]">Cool</span>
							</Control>

							<div className="flex items-center justify-between gap-4 border-t border-(--hair) pt-5">
								<span>
									<span className="block text-[15px] font-medium">
										Follow the sun
									</span>
									<span className="block text-[13px] text-(--muted)">
										{followSun && now
											? `${kelvin} K at ${clock(now)}.`
											: "Cool by day, warm by evening."}
									</span>
								</span>
								<Switch
									checked={followSun}
									onCheckedChange={setFollowSun}
									aria-label="Follow the sun"
								/>
							</div>
						</div>
					</GlassPane>
				</Stage>
			</Reveal>
		</section>
	);
}

function Control({
	label,
	value,
	children,
}: {
	label: string;
	value: string;
	children: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-baseline justify-between text-[13px]">
				<span className="font-medium">{label}</span>
				<span className="text-(--muted) tabular-nums">{value}</span>
			</div>
			<div className="flex items-center gap-3">{children}</div>
		</div>
	);
}
