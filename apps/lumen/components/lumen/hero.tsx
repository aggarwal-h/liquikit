"use client";

import { GlassScope } from "@/components/liquikit/glass";
import { SegmentedControl } from "@/components/liquikit/segmented-control";
import { BuyButton } from "./buy";
import { Lamp } from "./lamp";
import { SCENES } from "./light";
import { Stage } from "./stage";
import { useLumen } from "./state";

export function Hero() {
	const { light, chooseScene, finish } = useLumen();
	const scene = SCENES.find((s) => s.value === light.scene);

	return (
		<section className="flex flex-col items-center pt-20 text-center sm:pt-28">
			<p className="px-4 text-[17px] font-semibold text-[#f56300] sm:text-[21px]">
				New
			</p>
			<h1 className="bg-[linear-gradient(180deg,#fff_30%,#a1a1a6)] bg-clip-text text-[clamp(72px,14vw,168px)] leading-[0.92] font-bold tracking-[-0.045em] text-transparent">
				Lumen
			</h1>
			<p className="mt-4 max-w-[18ch] px-4 text-[clamp(26px,3.6vw,44px)] leading-[1.1] font-semibold tracking-[-0.03em] text-balance">
				Light that keeps time with you.
			</p>
			<Stage
				className="mt-2 max-w-[960px] [--lamp:min(420px,72vw)]"
				layout="flex flex-col items-center pt-[calc(var(--lamp)*0.34)] pb-8"
			>
				<Lamp
					kelvin={light.kelvin}
					level={light.on ? light.level : 0}
					finish={finish}
					size="var(--lamp)"
				/>
				<GlassScope className="capsule on-dark relative z-10 mt-[calc(var(--lamp)*0.1)] inline-block">
					<SegmentedControl
						options={SCENES.map(({ value, label }) => ({ value, label }))}
						value={light.scene}
						onValueChange={chooseScene}
						height={44}
						aria-label="Scene"
					/>
				</GlassScope>
				<p className="mt-4 min-h-[1.5em] px-6 text-[15px] text-(--muted)">
					{scene?.note}
				</p>
			</Stage>
			<div className="mt-6 flex flex-col items-center gap-5">
				<p className="text-[21px] font-semibold tracking-[-0.02em]">
					From $249
				</p>
				<div className="flex items-center gap-6">
					<BuyButton size="regular">Buy</BuyButton>
					<a
						href="#light"
						className="text-[17px] text-(--link) hover:underline"
					>
						Learn more ›
					</a>
				</div>
			</div>
		</section>
	);
}
